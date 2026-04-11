import React, { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar3.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

export default function GenerateBills() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const now = new Date();
  const [formData, setFormData] = useState({
    messId: "",
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, // proper YYYY-MM format
    dailyCost: "",
    extras: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const totalPerDay = Number(formData.dailyCost) || 0;
  const fixedCharges = Number(formData.extras) || 0;

  // Split daily cost equally among meals
  const computeMealRates = (daily) => {
    const perMeal = Number((daily / 3).toFixed(2));
    return {
      breakfast: perMeal,
      lunch: perMeal,
      eveningSnacks: 0,
      dinner: perMeal,
    };
  };

  const handleGenerate = async () => {
    if (!formData.messId?.trim()) {
      alert("Please enter Mess ID.");
      return;
    }

    if (!formData.month) {
      alert("Please select month.");
      return;
    }

    if (!formData.dailyCost || Number(formData.dailyCost) <= 0) {
      alert("Please enter a valid daily cost.");
      return;
    }

    // Extract year and month from YYYY-MM
    const [year, month] = formData.month.split("-").map(Number);

    const payload = {
      messId: formData.messId.trim(),
      month,
      year,
      mealRates: computeMealRates(totalPerDay),
      fixedCharges,
    };

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const res = await axios.post(
        `${API_BASE_URL}/api/bills/generate-all`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        alert(res.data.message || `Generated ${res.data.data?.generated || 0} bills.`);
      } else {
        alert(res.data?.message || "Failed to generate bills.");
      }
    } catch (err) {
      console.error("Generate bills error:", err);
      alert(
        err.response?.data?.message ||
          "Failed to generate bills. Check server logs for details."
      );
    } finally {
      setLoading(false);
    }
  };

  const total = totalPerDay + fixedCharges;

  return (
    <div className="min-h-screen font-sans">
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="container-narrow py-10">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Generate Mess Bills</h1>
          <p className="text-neutral-600 mt-1">
            Create and distribute monthly bills for all students in a mess.
          </p>
        </header>

        {/* Form */}
        <section className="bg-white border border-neutral-200 shadow-sm rounded-xl p-6 space-y-6">
          {/* Mess ID */}
          <div>
            <label className="text-sm text-neutral-600">Mess ID *</label>
            <input
              type="text"
              className="w-full border border-neutral-300 rounded-lg p-2 mt-1 text-sm focus:ring-2 focus:ring-blue-600"
              placeholder="Example: M01"
              value={formData.messId}
              onChange={(e) => handleChange("messId", e.target.value)}
            />
          </div>

          {/* Month */}
          <div>
            <label className="text-sm text-neutral-600">Select Month *</label>
            <input
              type="month"
              className="w-full border border-neutral-300 rounded-lg p-2 mt-1 text-sm focus:ring-2 focus:ring-blue-600"
              value={formData.month}
              onChange={(e) => handleChange("month", e.target.value)}
            />
          </div>

          {/* Daily Cost */}
          <div>
            <label className="text-sm text-neutral-600">
              Daily Cost (per student) *
            </label>
            <input
              type="number"
              className="w-full border border-neutral-300 rounded-lg p-2 mt-1 text-sm focus:ring-2 focus:ring-blue-600"
              placeholder="Example: 90"
              value={formData.dailyCost}
              onChange={(e) => handleChange("dailyCost", e.target.value)}
            />
            <p className="text-xs text-neutral-500 mt-1">
              Daily cost will be split equally across breakfast, lunch and dinner. Evening snacks set to ₹0.
            </p>
          </div>

          {/* Extra Charges */}
          <div>
            <label className="text-sm text-neutral-600">Extra Charges (optional)</label>
            <input
              type="number"
              className="w-full border border-neutral-300 rounded-lg p-2 mt-1 text-sm focus:ring-2 focus:ring-blue-600"
              placeholder="Example: 150"
              value={formData.extras}
              onChange={(e) => handleChange("extras", e.target.value)}
            />
          </div>

          {/* Preview */}
          <div className="text-lg font-semibold text-blue-700">
            Preview: Daily total ₹{totalPerDay} + Extra ₹{fixedCharges} = ₹{total}
          </div>
        </section>

        {/* Generate Button */}
        <div className="mt-8 flex justify-end">
          <PrimaryButton onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate Bills"}
          </PrimaryButton>
        </div>
      </main>
    </div>
  );
}
