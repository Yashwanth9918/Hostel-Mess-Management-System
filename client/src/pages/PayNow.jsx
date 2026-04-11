import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { markBillsAsPaid } from "../api/billAPI.js";

export default function PayNow() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const passedAmount = location?.state?.amount;
  const selectedBills = location?.state?.selectedBills || [];
  const amountToPay = parseFloat(passedAmount) || 0;
  const upiId = "iiitamess@oksbi";

  useEffect(() => {
    if (!passedAmount) {
      navigate("/pay-pending");
    }
  }, [passedAmount, navigate]);

  const copyUPI = () => {
    navigator.clipboard.writeText(upiId);
    alert("UPI ID Copied!");
  };

  const handleMarkPaid = async () => {
    if (!selectedBills.length) {
      alert("No bills selected to mark as paid");
      return;
    }

    try {
      const res = await markBillsAsPaid(selectedBills);
      if (res.data.success) {
        alert("✅ Bills marked as paid successfully!");
        navigate("/pay-pending");
      } else {
        alert("Failed to mark bills as paid");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while updating bills");
    }
  };

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="container-narrow py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Pay Now</h1>
          <p className="text-neutral-600 mt-1">
            Complete your payment using UPI. Your transaction will be processed securely.
          </p>
        </header>

        <div className="bg-white p-6 rounded-xl shadow-sm max-w-xl mx-auto">
          <div className="mb-6 text-center">
            <p className="text-neutral-600">Amount to Pay</p>
            <h2 className="text-3xl font-bold text-blue-700">
              ₹{amountToPay.toFixed(2)}
            </h2>
          </div>

          <div className="flex justify-center mb-6">
            <div className="p-3 border rounded-xl">
              <img
                src="/src/assets/upi-qr.png"
                alt="UPI QR Code"
                className="h-48 w-48 object-contain"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-neutral-700">UPI ID</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={upiId}
                disabled
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-100 text-sm"
              />
              <button
                onClick={copyUPI}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Use this UPI ID if QR is not scanning.
            </p>
          </div>

          <button
            className="w-full py-3 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700"
            onClick={handleMarkPaid}
          >
            ✅ I Have Paid
          </button>

          <p className="text-center text-xs text-neutral-500 mt-3">
            *Payment will be verified by the Mess Office.
          </p>
        </div>
      </main>
    </div>
  );
}
