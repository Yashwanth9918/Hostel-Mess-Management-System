# 🎓 Student Flows — Complete Feature Guide

> **Login**: Use the same Sign In page (`/signin`) with your student email and password.
> **Dashboard**: Redirects to `/student` after login.

---

## 1. Authentication

### 1.1 Register (Sign Up)
- **Frontend Page**: `/signup` → `SignUp.jsx`
- **Backend API**: `POST /api/auth/register`
- **Flow**:
  1. Student fills in: Name, Email, Password, Registration Number, Hostel ID, Mess ID, Contact Number
  2. Role is hardcoded to `student` on the frontend
  3. Backend validates inputs (email format, password ≥ 6 chars, contact 10 digits)
  4. Password is hashed via bcrypt before saving
  5. JWT token is generated and returned
  6. Redirect to Sign In page

### 1.2 Login (Sign In)
- **Frontend Page**: `/signin` → `SignIn.jsx`
- **Backend API**: `POST /api/auth/login`
- **Flow**:
  1. Enter email and password
  2. Backend verifies credentials
  3. Returns `{ data: { user, token } }`
  4. Token + user stored in `localStorage`
  5. Redirects to `/student` dashboard

### 1.3 Logout
- **Frontend**: Sidebar → Logout button
- **Backend API**: `POST /api/auth/logout`
- **Flow**:
  1. Calls logout API (clears server-side cookie)
  2. Removes `user` and `token` from localStorage
  3. Redirects to `/signin`

---

## 2. Dashboard (`/student`)

**Page**: `StudentDashboard.jsx`

On load, fetches 3 live statistics:

| Stat | Source API |
|---|---|
| Meals this month | `GET /api/attendance/monthly/:month/:year` |
| Avg rating given | `GET /api/feedback/my-feedback?startDate=...&endDate=...` |
| Pending bill amount | `GET /api/bills/my-bills` |

**Quick Action Cards**:
- 📋 **Menu** → Navigate to `/menu`
- ⭐ **Feedback** → Navigate to `/feedback`
- 📊 **Attendance** → Navigate to `/attendance`
- 💰 **Bills & Payments** → View Bills (`/bills`) or Pay Now (`/pay-pending`)

---

## 3. View Menu (`/menu`)

- **Frontend Page**: `Menu.jsx`
- **Backend API**: `GET /api/menu/current/:messId`
- **Flow**:
  1. Reads user's `messId` from localStorage
  2. Fetches current week's published menu
  3. Displays daily menu breakdown (breakfast, lunch, evening snacks, dinner)
  4. Also can view menu by date: `GET /api/menu/date/:messId/:date`

---

## 4. Feedback (`/feedback`)

- **Frontend Page**: `Feedback.jsx`
- **Backend API**: `POST /api/feedback`
- **Flow**:
  1. Select date and meal type (breakfast/lunch/eveningSnacks/dinner)
  2. Give overall rating (1-5 stars)
  3. Optionally add category ratings, comments, suggestions
  4. Option to submit anonymously
  5. Backend checks for duplicate feedback (same student + date + meal)
  6. Feedback saved with status `pending`

**Additional capabilities**:
- View my past feedback: `GET /api/feedback/my-feedback`
- Update pending feedback: `PUT /api/feedback/:id`
- Delete own pending feedback: `DELETE /api/feedback/:id`
- Upvote others' feedback: `PUT /api/feedback/:id/upvote`
- Remove upvote: `DELETE /api/feedback/:id/upvote`

---

## 5. Attendance (`/attendance`)

- **Frontend Page**: `Attendance.jsx`
- **Backend APIs**:
  - Mark attendance: `POST /api/attendance`
  - Register leave: `POST /api/attendance/leave`
  - View history: `GET /api/attendance/my-attendance?startDate=...&endDate=...`
  - Cancel leave: `PUT /api/attendance/cancel-leave/:id`

### 5.1 Mark Attendance
- **Flow**:
  1. Select date
  2. Choose meals (breakfast, lunch, evening snacks, dinner)
  3. Mark each as present/absent
  4. Submit — creates or updates attendance record

### 5.2 Register Leave
- **Flow**:
  1. Select start date and end date
  2. Choose reason (vacation, sick_leave, home_visit, emergency, other)
  3. Optionally add description
  4. Backend validates: no past dates, no overlap with existing leaves
  5. Creates one attendance record per day in the range

### 5.3 Cancel Leave
- **Flow**:
  1. View upcoming leaves in history
  2. Click cancel on a leave record
  3. Backend checks: student owns it, date is in the future
  4. Deletes the attendance record

### 5.4 Auto-Mark Present (Background)
- **Cron Job**: `cron/autoMarkPresent.js`
- Runs daily at **00:01 AM** server time
- For every student who has **no attendance record** for yesterday → marks all 4 meals as present (by system)
- Logic: "If you didn't mark absent or register leave, you're assumed present"

---

## 6. View Bills (`/bills`)

- **Frontend Page**: `ViewBills.jsx`
- **Backend API**: `GET /api/bills/my-bills`
- **Flow**:
  1. Fetches all bills for the logged-in student
  2. Displays: month/year, total amount, amount paid, amount due, payment status
  3. Status can be: `unpaid`, `partially_paid`, `paid`, `overdue`

---

## 7. Pay Pending Bills (`/pay-pending`)

- **Frontend Page**: `PayPendingBills.jsx`
- **Backend API**: `PUT /api/bills/mark-paid`
- **Flow**:
  1. Shows all unpaid/overdue bills
  2. Student selects bills to pay
  3. Navigates to `/pay-now` with selected bill IDs

---

## 8. Pay Now (`/pay-now`)

- **Frontend Page**: `PayNow.jsx`
- **Backend API**: `PUT /api/bills/mark-paid`
- **Flow**:
  1. Shows selected bills with total amount
  2. Student confirms payment (self-declaration via UPI)
  3. Backend marks bills as `paid`, records payment in `paymentHistory`
  4. Sets `amountDue = 0`, `paidDate = now`

---

## 9. Help (`/help`)

- **Frontend Page**: `Help.jsx`
- Static page with FAQs and contact information
- No backend API calls

---

## Sidebar Navigation (Student)

| Menu Item | Route | Icon |
|---|---|---|
| Dashboard | `/student` | 🏠 Home |
| Menu | `/menu` | 🍴 Utensils |
| Feedback | `/feedback` | ⭐ Star |
| Attendance | `/attendance` | 📋 ClipboardList |
| Bills & Payments | `/bills` | 💰 ReceiptIndianRupee |
| Help | `/help` | ❓ HelpCircle |
| Logout | (action) | 🚪 LogOut |
