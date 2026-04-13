# 🛡️ Admin Flows — Complete Feature Guide

> **Login**: Use the same Sign In page (`/signin`) with your admin email and password.
> **Dashboard**: Redirects to `/admin` after login.
> **Scope**: Admin has **full access** across all messes — no restrictions by `messId`.

---

## 1. Authentication

### 1.1 Login
- **Frontend Page**: `/signin` → `SignIn.jsx`
- **Backend API**: `POST /api/auth/login`
- **Flow**: Same login page as everyone. Role-based redirect sends admin to `/admin`.

### 1.2 Account Creation
- Admin accounts are created via:
  - Running `node seed.js` (creates default admin: `admin@mess.com` / `Admin@1234`)
  - Direct API call: `POST /api/auth/register` with `{ "role": "admin" }`
  - Another admin promoting a user via User Roles page

### 1.3 Logout
- **Frontend**: Sidebar → Logout button
- **Backend API**: `POST /api/auth/logout`

---

## 2. Dashboard (`/admin`)

**Page**: `HostelAdminDashboard.jsx`

On load, fetches live statistics:

| Stat | Source API |
|---|---|
| Total Students | `GET /api/bills/students-count` |
| Total Bills | `GET /api/bills/stats-all` |
| Paid Bills | `GET /api/bills/stats-all` |
| Unpaid/Pending Bills | `GET /api/bills/stats-all` (sums unpaid + partially_paid + overdue) |

**Quick Action Cards**:
- 💰 **Generate Mess Bills** → Navigate to `/generate-bills`
- ✅ **Payment Status & Records** → Navigate to `/payment-records`
- 📊 **System Reports & Analytics** → Navigate to `/system-reports`
- 👤 **User Roles & Permissions** → Navigate to `/user-roles`

---

## 3. Generate Bills (`/generate-bills`)

- **Frontend Page**: `GenerateBills.jsx`
- **Backend APIs**:
  - Generate for all students in a mess: `POST /api/bills/generate-all`
  - Generate for single student: `POST /api/bills/generate`

### 3.1 Generate Bills for All Students
- **Flow**:
  1. Select Mess ID (e.g., `M01`)
  2. Select month and year
  3. Optionally set custom meal rates:
     - Breakfast (default: ₹30)
     - Lunch (default: ₹50)
     - Evening Snacks (default: ₹20)
     - Dinner (default: ₹50)
  4. Optionally set fixed charges
  5. Click "Generate Bills"
  6. Backend loops through all active students in that mess
  7. For each student: calculates bill based on attendance records
  8. Returns: `{ generated: N, errors: M, errorDetails: [...] }`

### 3.2 How Bill Calculation Works (Backend Logic)
1. Fetches student's attendance records for the month
2. Counts meals present for each type (breakfast, lunch, etc.)
3. Multiplies by per-meal rate
4. Adds fixed charges
5. Rounds total to nearest rupee
6. Creates bill with status `unpaid`
7. Bill includes: `mealBreakdown`, `totalAmount`, `amountDue`, `dueDate`

### 3.3 Generate Bill for Single Student
- **Backend API**: `POST /api/bills/generate`
- **Flow**: Same as above but for one student (`studentId` required in body)

---

## 4. Payment Records (`/payment-records`)

- **Frontend Page**: `PaymentRecords.jsx`
- **Backend APIs**:
  - Get mess bills: `GET /api/bills/mess/:messId`
  - Get bill by ID: `GET /api/bills/:id`
  - Add payment: `POST /api/bills/:id/payment`

### 4.1 View All Bills
- **Flow**:
  1. Select a mess
  2. Optionally filter by: month, year, payment status, student ID
  3. Paginated list showing: student name, month/year, total, paid, due, status

### 4.2 View Bill Details
- **Flow**:
  1. Click on a bill
  2. Shows complete bill: meal breakdown, rates, amounts
  3. Shows payment history (all past payments with dates, methods, transaction IDs)

### 4.3 Record a Payment
- **Backend API**: `POST /api/bills/:id/payment`
- **Flow**:
  1. Open a bill → Click "Add Payment"
  2. Enter: amount, payment method, transaction ID, remarks
  3. Backend validates: amount ≤ amount due
  4. Updates `amountPaid`, `amountDue`, `paymentStatus`
  5. Adds entry to `paymentHistory` array

### 4.4 Apply Discount
- **Backend API**: `PUT /api/bills/:id/discount`
- **Flow**:
  1. Select a bill → Enter discount amount and reason
  2. Backend reduces `totalAmount` and recalculates `amountDue`

### 4.5 Apply Late Fee
- **Backend API**: `PUT /api/bills/:id/late-fee`
- **Flow**:
  1. Select an overdue bill → Enter fee amount and reason
  2. Backend increases `totalAmount` and `amountDue`

### 4.6 Auto-Apply Late Fees
- **Backend API**: `POST /api/bills/apply-late-fees`
- **Flow**:
  1. Click "Apply Late Fees to All Overdue"
  2. Optionally set fee amount (default: ₹50)
  3. Backend finds all overdue bills and applies the fee

### 4.7 Cancel a Bill
- **Backend API**: `PUT /api/bills/:id/cancel`
- **Flow**:
  1. Select a bill → Click Cancel → Enter reason
  2. Bill marked as `isCancelled: true`
  3. Bill no longer appears in normal queries

### 4.8 View Unpaid Bills
- **Backend API**: `GET /api/bills/unpaid/:messId`
- Shows all bills with `paymentStatus: 'unpaid'`

### 4.9 View Overdue Bills
- **Backend API**: `GET /api/bills/overdue/:messId`
- Shows all bills past their `dueDate` that are unpaid

### 4.10 Billing Summary
- **Backend API**: `GET /api/bills/summary/:messId/:month/:year`
- Aggregated stats: total billed, total collected, outstanding, collection rate

---

## 5. System Reports (`/system-reports`)

- **Frontend Page**: `SystemReports.jsx`
- **Backend APIs**:
  - System report: `GET /api/reports/system`
  - Student count: `GET /api/bills/students-count`
  - Bill stats: `GET /api/bills/stats-all` or `GET /api/bills/stats-all/:month/:year`

### 5.1 System-Wide Report
- **Flow**:
  1. Dashboard loads automatically
  2. Shows 4 key metrics:
     - **Total Students**: Count of active students
     - **Avg Meal Rating**: Average feedback rating for the current month
     - **Monthly Revenue**: Total paid amount this month
     - **Attendance Rate**: Overall attendance percentage
  3. All 4 queries run in parallel using `Promise.all` for performance

### 5.2 Bills Statistics
- **Flow**:
  1. View total bills, paid/unpaid/overdue breakdown
  2. Filter by month and year
  3. Shows: totalBills, paidBills, unpaidBills, partiallyPaidBills, overdueBills

---

## 6. User Roles & Permissions (`/user-roles`)

- **Frontend Page**: `UserRoles.jsx`
- **Backend APIs**:
  - Get all users: `GET /api/users`
  - Update role: `PUT /api/users/:id/role`

### 6.1 View All Users
- **Flow**:
  1. Fetches all registered users
  2. Displays: name, email, current role, messId
  3. Can search/filter users

### 6.2 Change User Role
- **Flow**:
  1. Find a user in the list
  2. Select new role from dropdown: `student` / `manager` / `admin`
  3. Click "Update"
  4. Backend validates role and updates the user document
  5. **Use case**: Promote a student to manager, or assign admin privileges

---

## Sidebar Navigation (Admin)

| Menu Item | Route | Icon |
|---|---|---|
| Dashboard | `/admin` | 🏠 Home |
| Generate Bills | `/generate-bills` | 📋 FileSpreadsheet |
| Payment Records | `/payment-records` | ✅ CheckCircle |
| System Reports | `/system-reports` | 📊 BarChart3 |
| Manage Roles | `/user-roles` | 👤 Users |
| Logout | (action) | 🚪 LogOut |

---

## Admin-Only Backend APIs (Not Available to Student or Manager)

| API | Purpose |
|---|---|
| `POST /api/bills/generate` | Generate bill for a single student |
| `POST /api/bills/generate-all` | Generate bills for all students in a mess |
| `PUT /api/bills/:id/discount` | Apply discount to a bill |
| `PUT /api/bills/:id/late-fee` | Apply late fee |
| `PUT /api/bills/:id/cancel` | Cancel a bill |
| `POST /api/bills/apply-late-fees` | Bulk auto-apply late fees |
| `PUT /api/bills/:id` | Update any bill field |
| `GET /api/bills/stats-all` | Get all bills statistics |
| `GET /api/bills/students-count` | Get total student count |
| `DELETE /api/attendance/:id` | Delete any attendance record |
| `GET /api/reports/system` | System-wide report (revenue, ratings) |
| `GET /api/users` | List all users |
| `PUT /api/users/:id/role` | Change a user's role |

---

## Admin vs Manager — Permissions Matrix

| Feature | Admin | Manager | Student |
|---|---|---|---|
| View any mess data | ✅ | ❌ Own mess only | ❌ Own data only |
| Create/edit menus | ✅ | ✅ Own mess | ❌ |
| View feedback analytics | ✅ | ✅ Own mess | ❌ |
| Respond to feedback | ✅ | ✅ Own mess | ❌ |
| View attendance insights | ✅ | ✅ Own mess | ❌ Own data only |
| Update student attendance | ✅ | ✅ Own mess | ❌ |
| Generate bills | ✅ | ❌ | ❌ |
| View/manage payments | ✅ | ❌ | View own only |
| Apply discounts/late fees | ✅ | ❌ | ❌ |
| Cancel bills | ✅ | ❌ | ❌ |
| View system reports | ✅ | ❌ | ❌ |
| Manage user roles | ✅ | ❌ | ❌ |
| Submit feedback | ❌ | ❌ | ✅ |
| Register leave | ❌ | ❌ | ✅ |
| Pay bills | ❌ | ❌ | ✅ |
