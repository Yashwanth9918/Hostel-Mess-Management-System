import React, { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

export default function MarkAbsence() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedDates, setSelectedDates] = useState([]);
  const [reason, setReason] = useState("");

  const upcomingDates = [
    "05 Mar 2025",
    "06 Mar 2025",
    "07 Mar 2025",
    "08 Mar 2025",
    "09 Mar 2025",
    "10 Mar 2025",
  ];

  const toggleDate = (date) => {
    setSelectedDates((prev) =>
      prev.includes(date)
        ? prev.filter((d) => d !== date)
        : [...prev, date]
    );
  };

  const handleSubmit = () => {
    if (selectedDates.length === 0) {
      alert("Please select at least one date.");
      return;
    }
    if (!reason.trim()) {
      alert("Please enter a reason for absence.");
      return;
    }

    alert(
      `Absence marked for: ${selectedDates.join(", ")}\nReason: ${reason}\n`
    );
  };

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="container-narrow py-10">

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Mark Absence</h1>
          <p className="text-neutral-600 mt-1">
            Select the days you will not be taking meals in the mess.
          </p>
        </header>

        {/* Dates List */}
        <section className="space-y-3 mb-6">
          {upcomingDates.map((date) => (
            <div
              key={date}
              onClick={() => toggleDate(date)}
              className={`flex items-center justify-between p-4 border rounded-xl shadow-sm cursor-pointer transition ${
                selectedDates.includes(date)
                  ? "bg-blue-50 border-blue-500"
                  : "bg-white"
              }`}
            >
              <span className="font-medium text-neutral-800">{date}</span>
              <input
                type="checkbox"
                checked={selectedDates.includes(date)}
                onChange={() => toggleDate(date)}
                className="h-5 w-5 accent-blue-600 cursor-pointer"
              />
            </div>
          ))}
        </section>

        {/* Reason */}
        <div className="mb-6">
          <label className="text-sm font-medium text-neutral-700">Reason for Absence</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg bg-white text-sm h-24 resize-none"
            placeholder="Ex: Going home, medical leave, event participation, etc."
          ></textarea>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-lg bg-blue-700 text-white font-medium text-sm hover:bg-blue-800"
        >
          Submit Request
        </button>

      </main>
    </div>
  );
}
