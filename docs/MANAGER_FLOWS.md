# 👨‍🍳 Mess Manager Flows — Complete Feature Guide

> **Login**: Use the same Sign In page (`/signin`) with your manager email and password.
> **Dashboard**: Redirects to `/manager` after login.
> **Scope**: A manager can only manage data for their **own mess** (identified by `messId`).

---

## 1. Authentication

### 1.1 Login
- **Frontend Page**: `/signin` → `SignIn.jsx`
- **Backend API**: `POST /api/auth/login`
- **Flow**: Same login page as students. Role-based redirect sends managers to `/manager`.

### 1.2 Account Creation
- Manager accounts **cannot** be created via the Sign Up page (it only allows `student` role).
- **Created by**:
  - Running `node seed.js` (seed script)
  - Admin promoting a user via `PUT /api/users/:id/role`
  - Direct API call: `POST /api/auth/register` with `{ "role": "manager", "messId": "M01" }`

### 1.3 Logout
- **Frontend**: Sidebar → Logout button
- **Backend API**: `POST /api/auth/logout`

---

## 2. Dashboard (`/manager`)

**Page**: `MessManagerDashboard.jsx`

On load, fetches 3 live statistics:

| Stat | Source API |
|---|---|
| Avg Meal Rating | `GET /api/feedback/statistics?month=...&year=...` |
| Absence Requests (today) | `GET /api/attendance/mess/:messId/:date` |
| Weekly Menu Cycles | `GET /api/menu/mess/:messId?limit=52` |

**Quick Action Cards**:
- 🍴 **Weekly Menu Management** → Navigate to `/manage-menus`
- 📊 **Feedback Analytics** → Navigate to `/feedback-analytics`
- 📋 **Attendance Insights** → Navigate to `/attendance-insights`
- 📄 **Feedback Reports** → Navigate to `/feedback-reports`

---

## 3. Manage Menus (`/manage-menus`)

- **Frontend Page**: `ManageMenus.jsx`
- **Backend APIs**:
  - Create menu: `POST /api/menu`
  - Update menu: `PUT /api/menu/:id`
  - Delete menu: `DELETE /api/menu/:id`
  - Publish menu: `PUT /api/menu/:id/publish`
  - Get all menus: `GET /api/menu/mess/:messId`

### 3.1 Create Weekly Menu
- **Flow**:
  1. Set week start date and end date
  2. For each day of the week, add menu items for each meal:
     - **Breakfast** (items list)
     - **Lunch** (items list)
     - **Evening Snacks** (items list)
     - **Dinner** (items list)
  3. Optionally add an announcement (max 1000 chars)
  4. Submit — menu is created in `draft` status
  5. Backend validates: no duplicate menu for the same week + mess

### 3.2 Publish Menu
- **Flow**:
  1. View list of draft/existing menus
  2. Click "Publish" on a menu
  3. Status changes from `draft` → `published`
  4. Students can now see it via the Menu page

### 3.3 Update Menu
- **Flow**:
  1. Select an existing menu
  2. Edit daily items, announcement
  3. Save changes (PUT request with updated data)

### 3.4 Delete Menu
- **Flow**:
  1. Select a menu → Click Delete
  2. Backend removes the document
  3. Note: Managers can only delete menus for **their own mess**

---

## 4. Feedback Analytics (`/feedback-analytics`)

- **Frontend Page**: `FeedbackAnalytics.jsx`
- **Backend APIs**:
  - Consolidated report: `GET /api/feedback/consolidated?messId=...&month=...&year=...`
  - Mess feedbacks: `GET /api/feedback/mess?messId=...`
  - Pending feedbacks: `GET /api/feedback/pending?messId=...`
  - Statistics: `GET /api/feedback/statistics?month=...&year=...`

### 4.1 View Consolidated Feedback
- **Flow**:
  1. Select month and year
  2. Backend aggregates all feedback for the mess
  3. Shows: average ratings, meal-wise breakdowns, trends

### 4.2 View All Feedbacks
- **Flow**:
  1. Filter by: status, meal type, date range, rating range
  2. Paginated list with student info, ratings, comments
  3. Option to sort by priority or date

### 4.3 View Pending Feedbacks
- **Flow**:
  1. Shows all feedbacks with status `pending`
  2. Manager can respond to each one

### 4.4 Respond to Feedback
- **Backend API**: `PUT /api/feedback/:id/respond`
- **Flow**:
  1. Click on a pending feedback
  2. Write response text
  3. Optionally add "action taken" notes
  4. Optionally change status (acknowledged, in_progress, resolved, dismissed)
  5. Response saved with manager's ID and timestamp

### 4.5 Update Feedback Status
- **Backend API**: `PUT /api/feedback/:id/status`
- **Flow**:
  1. Change status: `pending` → `acknowledged` → `in_progress` → `resolved` / `dismissed`

### 4.6 View Feedback Statistics
- **Flow**:
  1. Select month/year
  2. Shows: average ratings, meal-wise ratings, rating distribution (1-5 star counts)

---

## 5. Attendance Insights (`/attendance-insights`)

- **Frontend Page**: `AttendanceInsights.jsx`
- **Backend APIs**:
  - Mess attendance: `GET /api/attendance/mess/:messId/:date`
  - Attendance summary: `GET /api/attendance/summary/:studentId/:month/:year`
  - Student count: `GET /api/users/count?messId=...`

### 5.1 View Daily Mess Attendance
- **Flow**:
  1. Select a date
  2. Backend returns all attendance records for the mess on that date
  3. Shows: student name, registration number, meals present, on leave status
  4. Statistics bar: total students, present, on leave, absent

### 5.2 View Student Attendance Summary
- **Flow**:
  1. Select a student and month/year
  2. Shows: total days, present days, absent days, total meals present/absent
  3. Attendance percentage calculated

### 5.3 Update Student Attendance
- **Backend API**: `PUT /api/attendance/:id`
- **Flow**:
  1. Manager selects a student's attendance record
  2. Can update meal attendance or leave status
  3. Only for students in their own mess

---

## 6. Feedback Reports (`/feedback-reports`)

- **Frontend Page**: `FeedbackReports.jsx`
- **Backend APIs**: Same as Feedback Analytics
- **Flow**:
  1. Select report type (weekly/monthly)
  2. Select date range
  3. Generates downloadable feedback report
  4. Uses `html2canvas` + `jspdf` for PDF generation (client-side)

---

## Sidebar Navigation (Manager)

| Menu Item | Route | Icon |
|---|---|---|
| Dashboard | `/manager` | 🏠 Home |
| Manage Menus | `/manage-menus` | 🍴 Utensils |
| Feedback Analytics | `/feedback-analytics` | 📊 BarChart3 |
| Attendance Insights | `/attendance-insights` | 📋 ClipboardList |
| Feedback Reports | `/feedback-reports` | 📄 FileText |
| Logout | (action) | 🚪 LogOut |

---

## Authorization Constraints

| Action | Constraint |
|---|---|
| View feedback | Only for their own mess |
| Respond to feedback | Only for their own mess |
| Create/edit menus | Only for their own mess |
| View attendance | Only for their own mess |
| Update attendance | Only for students in their own mess |
| Manage bills | ❌ Not available (admin only) |
| Manage users/roles | ❌ Not available (admin only) |
