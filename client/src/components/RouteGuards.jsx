import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Route guard helpers for frontend route protection.
 *
 * Usage in App.jsx:
 *   <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
 *   <Route path="/signin"  element={<GuestRoute><SignIn /></GuestRoute>} />
 */

// ── Helper: read auth state from localStorage ───────────────────
function getAuth() {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

/**
 * ProtectedRoute — only allows authenticated users.
 *
 * @param {string|string[]} role - If provided, restricts to specific role(s).
 *                                  e.g. "student", ["manager","admin"]
 * @param {ReactNode} children - The page component to render.
 *
 * Redirects to /signin if not logged in.
 * Redirects to user's dashboard if wrong role.
 */
export function ProtectedRoute({ role, children }) {
  const { token, user } = getAuth();

  // Not logged in → go to sign in
  if (!token || !user) {
    return <Navigate to="/signin" replace />;
  }

  // Role check (if specified)
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(user.role)) {
      // Redirect to the user's own dashboard
      const dashboardMap = {
        student: "/student",
        manager: "/manager",
        admin: "/admin",
      };
      return <Navigate to={dashboardMap[user.role] || "/signin"} replace />;
    }
  }

  return children;
}

/**
 * GuestRoute — only allows unauthenticated users (sign-in, sign-up).
 *
 * If already logged in, redirects to the user's dashboard.
 */
export function GuestRoute({ children }) {
  const { token, user } = getAuth();

  if (token && user) {
    const dashboardMap = {
      student: "/student",
      manager: "/manager",
      admin: "/admin",
    };
    return <Navigate to={dashboardMap[user.role] || "/student"} replace />;
  }

  return children;
}
