// controllers/billController.js
import Bill from '../models/Bill.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';

// Default meal rates (can be configured)
const DEFAULT_MEAL_RATES = {
  breakfast: 30,
  lunch: 50,
  eveningSnacks: 20,
  dinner: 50,
};

const DEFAULT_FIXED_CHARGES = 0; // Monthly fixed charges

// Helper: round to nearest rupee and save only if changed
async function ensureRoundedTotal(bill) {
  if (!bill) return bill;
  // If Mongoose doc or plain object: access .totalAmount
  const current = bill.totalAmount;
  if (current == null) return bill;

  const rounded = Math.round(Number(current));
  // If already a Mongoose doc, update & save only when changed
  if (bill.isModified !== undefined) {
    if (rounded !== current) {
      bill.totalAmount = rounded;
      await bill.save();
    }
    return bill;
  } else {
    // Plain object (not a doc) — optional: return rounded value
    bill.totalAmount = rounded;
    return bill;
  }
}


// @desc    Get total count of all students
// @route   GET /api/auth/students-count
// @access  Private (Admin only)
// @desc    Get total count of all bills with status breakdown
// @route   GET /api/bills/stats-all
// @access  Private (Admin only)
// @desc    Get total count of all bills with status breakdown
// @route   GET /api/bills/stats-all
// @access  Private (Admin only)
export const getAllBillsStats = async (req, res) => {
  try {
    // Accept optional month/year in params: /stats-all/:month/:year
    const month = req.params?.month ? parseInt(req.params.month) : null;
    const year = req.params?.year ? parseInt(req.params.year) : null;

    const match = {
      isActive: true,
      isCancelled: false,
    };

    if (month && year) {
      match.month = month;
      match.year = year;
    }

    const result = await Bill.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          paidBills: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] },
          },
          unpaidBills: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'unpaid'] }, 1, 0] },
          },
          partiallyPaidBills: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'partially_paid'] }, 1, 0] },
          },
          overdueBills: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'overdue'] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = result.length > 0 ? result[0] : {
      totalBills: 0,
      paidBills: 0,
      unpaidBills: 0,
      partiallyPaidBills: 0,
      overdueBills: 0,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching all bills stats', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bills stats',
      error: error.message,
    });
  }
};


// @desc    Get total count of all students
// @route   GET /api/auth/students-count
// @access  Private (Admin only)
export const getStudentsCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'student', isActive: true });

    res.status(200).json({
      success: true,
      data: {
        totalStudents: count,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students count',
      error: error.message,
    });
  }
};

// @desc    Generate bill for a student
// @route   POST /api/bills/generate
// @access  Private (Admin only)
export const markBillsAsPaid = async (req, res) => {
  try {
    const { billIds } = req.body;

    if (!Array.isArray(billIds) || billIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No bills provided",
      });
    }

    // Fetch bills that belong to this student
    const bills = await Bill.find({
      _id: { $in: billIds },
      studentId: req.user._id,
      isActive: true,
      isCancelled: false,
    });

    if (bills.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid bills found for this user",
      });
    }

    // Update each bill individually (so we can apply model logic)
    for (const bill of bills) {
      bill.amountPaid = bill.totalAmount;
      bill.amountDue = 0;
      bill.paymentStatus = "paid";
      bill.paidDate = new Date();
      bill.paymentHistory.push({
        amount: bill.totalAmount,
        paymentMethod: "upi",
        transactionId: `manual-${Date.now()}`,
        paymentStatus: "success",
        remarks: "Student marked as paid via UPI self-confirmation",
        receivedBy: req.user._id, // optional
      });
      await bill.save();
    }

    res.status(200).json({
      success: true,
      message: `${bills.length} bills marked as paid successfully`,
    });
  } catch (error) {
    console.error("❌ Error in markBillsAsPaid:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking bills as paid",
      error: error.message,
    });
  }
};


export const generateBill = async (req, res) => {
  try {
    const { studentId, messId, month, year, mealRates, fixedCharges } = req.body;

    const rates = mealRates || DEFAULT_MEAL_RATES;
    const fixed = fixedCharges || DEFAULT_FIXED_CHARGES;

    const bill = await Bill.generateFromAttendance(
      studentId,
      messId,
      month,
      year,
      rates,
      fixed,
      req.user._id
    );

    // Reload populated bill and ensure rounding
    const populatedBill = await Bill.findById(bill._id).populate(
      'studentId',
      'name email registrationNumber hostelId'
    );

    await ensureRoundedTotal(populatedBill);

    const finalBill = await Bill.findById(bill._id).populate(
      'studentId',
      'name email registrationNumber hostelId'
    );

    res.status(201).json({
      success: true,
      message: 'Bill generated successfully',
      data: finalBill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating bill',
      error: error.message,
    });
  }
};

// @desc    Generate bills for all students in a mess
// @route   POST /api/bills/generate-all
// @access  Private (Admin only)
export const generateAllBills = async (req, res) => {
  try {
    const { messId, month, year, mealRates, fixedCharges } = req.body;

    const rates = mealRates || DEFAULT_MEAL_RATES;
    const fixed = fixedCharges || DEFAULT_FIXED_CHARGES;

    // Get all students in the mess
    const students = await User.find({ messId, role: 'student', isActive: true });

    const generatedBills = [];
    const errors = [];

    for (const student of students) {
      try {
        const bill = await Bill.generateFromAttendance(
          student._id,
          messId,
          month,
          year,
          rates,
          fixed,
          req.user._id
        );

        // Ensure rounding on the created bill
        const doc = await Bill.findById(bill._id);
        await ensureRoundedTotal(doc);

        generatedBills.push(bill);
      } catch (error) {
        errors.push({
          studentId: student._id,
          name: student.name,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Generated ${generatedBills.length} bills successfully`,
      data: {
        generated: generatedBills.length,
        errors: errors.length,
        errorDetails: errors,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating bills',
      error: error.message,
    });
  }
};

// @desc    Get my bills
// @route   GET /api/bills/my-bills
// @access  Private (Student)

export const getMyBills = async (req, res) => {
  try {
    const { year, paymentStatus } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      studentId: req.user._id,
      isActive: true,
      isCancelled: false,
    };

    if (year) query.year = parseInt(year);
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const bills = await Bill.find(query)
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bill.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bills.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: bills,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bills',
      error: error.message,
    });
  }
};

// @desc    Get bill by ID
// @route   GET /api/bills/:id
// @access  Private
export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('studentId', 'name email registrationNumber hostelId messId')
      .populate('generatedBy', 'name email')
      .populate('paymentHistory.receivedBy', 'name email');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    // Students can only view their own bills
    if (
      req.user.role === 'student' &&
      bill.studentId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own bills',
      });
    }

    // Managers can only view bills for their mess
    if (req.user.role === 'manager' && bill.messId !== req.user.messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view bills for your assigned mess',
      });
    }

    res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bill',
      error: error.message,
    });
  }
};

// @desc    Get all bills for mess
// @route   GET /api/bills/mess/:messId
// @access  Private (Manager/Admin)
export const getMessBills = async (req, res) => {
  try {
    const { messId } = req.params;
    const { month, year, paymentStatus, studentId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Check if manager's messId matches
    if (req.user.role === 'manager' && req.user.messId !== messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view bills for your assigned mess',
      });
    }

    const query = {
      messId,
      isActive: true,
      isCancelled: false,
    };

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (studentId) query.studentId = studentId;

    const bills = await Bill.find(query)
      .sort({ year: -1, month: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('studentId', 'name registrationNumber hostelId email');

    const total = await Bill.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bills.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: bills,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bills',
      error: error.message,
    });
  }
};

// @desc    Get unpaid bills
// @route   GET /api/bills/unpaid/:messId
// @access  Private (Manager/Admin)
export const getUnpaidBills = async (req, res) => {
  try {
    const { messId } = req.params;

    // Check if manager's messId matches
    if (req.user.role === 'manager' && req.user.messId !== messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view bills for your assigned mess',
      });
    }

    const bills = await Bill.getUnpaidBills(messId);

    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching unpaid bills',
      error: error.message,
    });
  }
};

// @desc    Get overdue bills
// @route   GET /api/bills/overdue/:messId
// @access  Private (Manager/Admin)
export const getOverdueBills = async (req, res) => {
  try {
    const { messId } = req.params;

    // Check if manager's messId matches
    if (req.user.role === 'manager' && req.user.messId !== messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view bills for your assigned mess',
      });
    }

    const bills = await Bill.getOverdueBills(messId);

    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching overdue bills',
      error: error.message,
    });
  }
};

// @desc    Add payment to bill
// @route   POST /api/bills/:id/payment
// @access  Private (Manager/Admin)
export const addPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, remarks } = req.body;

    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    // Check if manager's messId matches
    if (req.user.role === 'manager' && bill.messId !== req.user.messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only process payments for your assigned mess',
      });
    }

    if (amount > bill.amountDue) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds due amount',
      });
    }

    bill.addPayment(amount, paymentMethod, transactionId, req.user._id, remarks);
    await bill.save();

    const updatedBill = await Bill.findById(bill._id)
      .populate('studentId', 'name registrationNumber')
      .populate('paymentHistory.receivedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Payment added successfully',
      data: updatedBill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding payment',
      error: error.message,
    });
  }
};

// @desc    Apply discount
// @route   PUT /api/bills/:id/discount
// @access  Private (Admin only)
export const applyDiscount = async (req, res) => {
  try {
    const { discountAmount, reason } = req.body;

    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    bill.applyDiscount(discountAmount, reason);
    await bill.save();

    // ensure rounding after modifications
    await ensureRoundedTotal(bill);

    res.status(200).json({
      success: true,
      message: 'Discount applied successfully',
      data: bill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while applying discount',
      error: error.message,
    });
  }
};

// @desc    Apply late fee
// @route   PUT /api/bills/:id/late-fee
// @access  Private (Admin only)
export const applyLateFee = async (req, res) => {
  try {
    const { feeAmount, reason } = req.body;

    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    bill.applyLateFee(feeAmount, reason);
    await bill.save();

    // ensure rounding after modifications
    await ensureRoundedTotal(bill);

    res.status(200).json({
      success: true,
      message: 'Late fee applied successfully',
      data: bill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while applying late fee',
      error: error.message,
    });
  }
};

// @desc    Cancel bill
// @route   PUT /api/bills/:id/cancel
// @access  Private (Admin only)
export const cancelBill = async (req, res) => {
  try {
    const { reason } = req.body;

    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    bill.cancelBill(req.user._id, reason);
    await bill.save();

    res.status(200).json({
      success: true,
      message: 'Bill cancelled successfully',
      data: bill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling bill',
      error: error.message,
    });
  }
};

// @desc    Get billing summary
// @route   GET /api/bills/summary/:messId/:month/:year
// @access  Private (Manager/Admin)
export const getBillingSummary = async (req, res) => {
  try {
    const { messId, month, year } = req.params;

    // Check if manager's messId matches
    if (req.user.role === 'manager' && req.user.messId !== messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view summary for your assigned mess',
      });
    }

    const summary = await Bill.getBillingSummary(
      messId,
      parseInt(month),
      parseInt(year)
    );

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'No billing data found for the specified period',
      });
    }

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching billing summary',
      error: error.message,
    });
  }
};

// @desc    Auto-apply late fees
// @route   POST /api/bills/apply-late-fees
// @access  Private (Admin only)
export const autoApplyLateFees = async (req, res) => {
  try {
    const { lateFeeAmount } = req.body;
    const amount = lateFeeAmount || 50;

    const count = await Bill.applyLateFees(amount);

    res.status(200).json({
      success: true,
      message: `Late fees applied to ${count} bills`,
      data: { billsUpdated: count },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while applying late fees',
      error: error.message,
    });
  }
};

// @desc    Update bill
// @route   PUT /api/bills/:id
// @access  Private (Admin only)
export const updateBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    let updatedBill = await Bill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('studentId', 'name registrationNumber');

    // Ensure rounding after update (and save only if needed)
    const doc = await Bill.findById(updatedBill._id);
    await ensureRoundedTotal(doc);

    // Re-populate after possible save
    updatedBill = await Bill.findById(updatedBill._id).populate('studentId', 'name registrationNumber');

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully',
      data: updatedBill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating bill',
      error: error.message,
    });
  }
};
