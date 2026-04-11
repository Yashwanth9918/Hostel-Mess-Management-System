import React, { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar3.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { getMessBills } from "../api/billAPI.js";

export default function PaymentRecords() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState([]);
  const [messId, setMessId] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const loadBills = async () => {
    if (!messId?.trim()) {
      alert("Please enter a Mess ID");
      return;
    }
    try {
      setLoading(true);
      const res = await getMessBills(messId.trim(), { limit: 500 });
      if (res.data?.success) {
        setBills(res.data.data || []);
      } else {
        setBills([]);
        alert(res.data?.message || "Failed to load bills");
      }
    } catch (err) {
      console.error("Load bills error:", err);
      alert(err.response?.data?.message || "Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const filtered = bills
    .filter((b) => {
      if (filter !== "All" && b.paymentStatus !== filter.toLowerCase()) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (b.studentId?.name || "").toLowerCase().includes(q) ||
        (b.studentId?.registrationNumber || "").toLowerCase().includes(q) ||
        `${b.month}/${b.year}`.includes(q)
      );
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

  return (
    <div className="min-h-screen font-sans">
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="container-narrow py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Payment Status & Records</h1>
          <p className="text-neutral-600 mt-1">
            Admin view: load bills for a mess and inspect payment status.
          </p>
        </header>

        {/* Controls */}
        <div className="bg-white p-4 rounded-xl border mb-6 flex gap-3 items-center">
          <input
            type="text"
            placeholder="Enter Mess ID (e.g. M01)"
            value={messId}
            onChange={(e) => setMessId(e.target.value)}
            className="px-3 py-2 border rounded-md w-44 text-sm"
          />
          <PrimaryButton onClick={loadBills} disabled={loading}>
            {loading ? "Loading..." : "Load Bills"}
          </PrimaryButton>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="ml-auto px-3 py-2 border rounded-md text-sm"
          >
            {["All", "paid", "partially_paid", "unpaid", "overdue", "waived"].map((f) => (
              <option key={f} value={f}>
                {f === "All" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </option>
            ))}
          </select>

          <input
            type="search"
            placeholder="Search student / month..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-md w-56 text-sm"
          />
        </div>

        {/* List */}
        {loading ? (
          <p className="text-center py-10">Loading bills...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500">No bills to show.</p>
        ) : (
          <section className="space-y-3">
            {filtered.map((bill) => (
              <div
                key={bill._id}
                className="bg-white border border-neutral-200 shadow-sm rounded-xl p-5 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-lg font-semibold">
                      {bill.studentId?.name ?? "Student"} — <span className="text-sm text-neutral-600">{bill.studentId?.registrationNumber ?? ""}</span>
                    </h3>
                    <span className="text-sm text-neutral-500">| {bill.month}/{bill.year}</span>
                  </div>
                  <p className="text-neutral-600 mt-1">Amount: ₹{(bill.totalAmount ?? 0).toFixed?.(2) ?? bill.totalAmount}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      bill.paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : bill.paymentStatus === "overdue"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {bill.paymentStatus?.charAt(0)?.toUpperCase() + bill.paymentStatus?.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
