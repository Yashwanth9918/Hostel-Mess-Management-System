import React from "react";
import {
  Home,
  Utensils,
  Star,
  ClipboardList,
  ReceiptIndianRupee,
  HelpCircle,
  LogOut,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api.js";

const NAV = [
  { icon: Home, label: "Dashboard", path: "/student" },
  { icon: Utensils, label: "Menu", path: "/menu" },
  { icon: Star, label: "Feedback", path: "/feedback" },
  { icon: ClipboardList, label: "Attendance", path: "/attendance" },
  { icon: ReceiptIndianRupee, label: "Bills & Payments", path: "/bills" },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      alert("You have been logged out successfully!");
      navigate("/signin");
    } catch (error) {
      console.error("Logout Error:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white/70 backdrop-blur-md border-r border-neutral-200 shadow-soft transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center px-5 border-b border-neutral-200">
          <span className="text-sm font-medium text-primary bg-accent px-2 py-1 rounded-md">
            IIITA Mess
          </span>
        </div>

        <nav className="p-3">
          <ul className="space-y-1">
            {NAV.map(({ icon: Icon, label, path }) => (
              <li key={label}>
                <button
                  onClick={() => {
                    navigate(path);
                    onClose?.();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/70 text-left"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-neutral-200/70">
            {/* Help instead of Settings */}
            <button
              onClick={() => {
                navigate("/help");
                onClose?.();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/70 text-left"
            >
              <HelpCircle className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Help</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/70 text-left"
            >
              <LogOut className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
