import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { getMyBills } from "../api/billAPI.js";
import { useNavigate } from "react-router-dom";

export default function ViewBills() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchBills = async (p = 1) => {
    try {
      setLoading(true);
      const res = await getMyBills({ page: p, limit: 50 });
      if (res.data?.success) {
        setBills(res.data.data || []);
      } else {
        console.warn("Failed to load bills:", res.data);
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
      alert(err.response?.data?.message || "Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(page);
  }, [page]);

  const pendingExists = bills.some((b) => b.paymentStatus === "unpaid" || b.paymentStatus === "partially_paid" || b.paymentStatus === "overdue");

  return (
    <div className="min-h-screen font-sans">
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="container-narrow py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Bills & Payments</h1>
          <p className="text-neutral-600 mt-1">Your monthly mess bills and payment status.</p>
        </header>

        {loading ? (
          <p className="text-center py-10">Loading bills...</p>
        ) : bills.length === 0 ? (
          <p className="text-center text-gray-500">No bills found for your account.</p>
        ) : (
          <section className="space-y-4">
            {bills.map((bill) => (
              <div key={bill._id} className="bg-white border border-neutral-200 shadow-sm rounded-xl p-5 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">{bill.month}/{bill.year}</h2>
                  <p className="text-neutral-600">Amount: ₹{Math.round(bill.totalAmount)?.toFixed?.(2) ?? Math.round(bill.totalAmount)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium 
                  ${bill.paymentStatus === "paid" ? "bg-green-100 text-green-700" : bill.paymentStatus === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"}
                `}>
                  {bill.paymentStatus?.charAt(0)?.toUpperCase() + bill.paymentStatus?.slice(1)}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* Quick action */}
        {pendingExists && (
          <div className="mt-8 flex justify-end">
            <PrimaryButton onClick={() => navigate("/pay-pending")}>Pay Pending Bills</PrimaryButton>
          </div>
        )}
      </main>
    </div>
  );
}


