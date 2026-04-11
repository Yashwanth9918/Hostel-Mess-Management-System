import User from "../models/User.js";

/**
 * @desc Get all users
 * @route GET /api/users
 * @access Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("name email role messId");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

/**
 * @desc Update user role
 * @route PUT /api/users/:id/role
 * @access Admin
 */
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["student", "manager", "admin"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("name email role messId");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating user role",
      error: error.message,
    });
  }
};

/**
 * @desc Get total student count (optionally by messId)
 * @route GET /api/users/count
 * @access Admin or Manager
 */
export const getStudentCount = async (req, res) => {
  try {
    const { messId } = req.query;

    // Count all users with role = "student"
    const query = { role: "student" };
    if (messId) query.messId = messId;

    const totalStudents = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: { totalStudents },
    });
  } catch (error) {
    console.error("Error fetching student count:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching student count",
      error: error.message,
    });
  }
};
