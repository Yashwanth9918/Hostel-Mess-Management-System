import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import MessManagerDashboard from "./pages/MessManagerDashboard.jsx";
import HostelAdminDashboard from "./pages/HostelAdminDashboard.jsx";
import Feedback from "./pages/Feedback.jsx";
import Menu from "./pages/Menu.jsx";
import ViewBills from "./pages/ViewBills.jsx";
import Attendance from "./pages/Attendance.jsx";
import ManageMenus from "./pages/ManageMenus.jsx";
import FeedbackAnalytics from "./pages/FeedbackAnalytics.jsx";
import PaymentRecords from "./pages/PaymentRecords.jsx";
import GenerateBills from "./pages/GenerateBills.jsx";
import AttendanceInsights from "./pages/AttendanceInsights.jsx";
import PayPendingBills from "./pages/PayPendingBills.jsx";
import PayNow from "./pages/PayNow.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Help from "./pages/Help.jsx";
import FeedbackReports from "./pages/FeedbackReports.jsx";
import SystemReports from "./pages/SystemReports.jsx";
import UserRoles from "./pages/UserRoles.jsx";












export default function App(){
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/manager" element={<MessManagerDashboard />} />
      <Route path="/admin" element={<HostelAdminDashboard />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/bills" element={<ViewBills />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/manage-menus" element={<ManageMenus />} />
      <Route path="/feedback-analytics" element={<FeedbackAnalytics />} />
      <Route path="/attendance-insights" element={<AttendanceInsights />} />
      <Route path="/payment-records" element={<PaymentRecords />} />
      <Route path="/generate-bills" element={<GenerateBills />} />
      <Route path="/pay-pending" element={<PayPendingBills />} />
      <Route path="/pay-now" element={<PayNow />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/help" element={<Help />} />
      <Route path="/feedback-reports" element={<FeedbackReports />} />
      <Route path="/system-reports" element={<SystemReports />} />
      <Route path="/user-roles" element={<UserRoles />} />









      <Route path="*" element={<h1 className="p-8 text-2xl">404 • Page not found</h1>} />
    </Routes>
  );
}
