import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar2.jsx";
import StatBadge from "../components/StatBadge.jsx";
import axios from "axios";
import { API_BASE_URL } from "../config/api.js";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

export default function AttendanceInsights() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // month input (YYYY-MM) default current month
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);

  // analytics state
  const [dailyStats, setDailyStats] = useState([]); // [{ date: '05 Mar', presentPct: 80, avgMealsPerStudent: 3.2 }]
  const [weekdayStats, setWeekdayStats] = useState([]); // [{ day: 'Mon', presentPct: 78 }, ...]
  const [kpis, setKpis] = useState({
    avgDailyPresencePct: 0,
    avgMealsPerStudent: 0,
    totalLeaveDays: 0,
  });

  const BASE = API_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const messId = user?.messId;

  // Only mess manager should access — quick client-side guard
  useEffect(() => {
    if (user?.role !== "manager" && user?.role !== "admin") {
      // not manager/admin — nothing to load
      return;
    }
  }, [user]);

  const parseMonthToRange = (monthStr) => {
    const [y, m] = monthStr.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    return { start, end };
  };

  const formatShort = (d) => {
    const dd = new Date(d);
    return dd.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  };

  const loadAnalytics = async () => {
    if (!messId) {
      alert("Manager's messId not found in profile. Ensure you are signed in.");
      return;
    }

    setLoading(true);
    try {
      const { start, end } = parseMonthToRange(month);
      const days = [];
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        days.push(new Date(dt));
      }

      // Parallel requests (one per day) to server endpoint:
      // controller: [`getMessAttendance`](server/controllers/attendanceController.js) - GET /api/attendance/mess/:messId/:date
      const promises = days.map((d) =>
        axios.get(
          `${BASE}/api/attendance/mess/${encodeURIComponent(messId)}/${d.toISOString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).then(res => ({ ok: true, data: res.data })).catch(err => ({ ok: false, error: err }))
      );

      const results = await Promise.all(promises);

      // Aggregate across days
      const daily = [];
      const weekdayAgg = {}; // { Monday: { presentPctSum, count } }
      let totalPresentPctSum = 0;
      let totalMealsPerStudentSum = 0;
      let countedDays = 0;
  let totalLeaveDays = 0;

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const res = results[i];

        if (!res.ok) {
          // treat as no data day
          continue;
        }

        const stats = res.data.statistics || {};
        const attendanceRecords = res.data.data || [];

        const totalStudents = stats.totalStudents || (attendanceRecords.length || 0);
        const studentsPresent = stats.studentsPresent || 0;
        const studentsOnLeave = stats.studentsOnLeave || 0;
  // There is no explicit 'absent' marking in the system (only present or leave)
  // so we don't compute absent entries here.

        // compute avg meals per student for the day (sum totalMealsPresent / totalStudents)
        const totalMealsPresent = attendanceRecords.reduce((s, a) => s + (a.totalMealsPresent || 0), 0);
        const avgMealsPerStudent = totalStudents > 0 ? totalMealsPresent / totalStudents : 0;

        const presentPct = totalStudents > 0 ? (studentsPresent / totalStudents) * 100 : 0;

        daily.push({
          date: formatShort(day),
          presentPct: Number(presentPct.toFixed(2)),
          avgMealsPerStudent: Number(avgMealsPerStudent.toFixed(2)),
        });

        // weekday aggregation
        const wday = new Date(day).toLocaleDateString(undefined, { weekday: "short" }); // Mon, Tue...
        weekdayAgg[wday] = weekdayAgg[wday] || { presentPctSum: 0, avgMealsSum: 0, count: 0 };
        weekdayAgg[wday].presentPctSum += presentPct;
        weekdayAgg[wday].avgMealsSum += avgMealsPerStudent;
        weekdayAgg[wday].count += 1;

        totalPresentPctSum += presentPct;
        totalMealsPerStudentSum += avgMealsPerStudent;
        countedDays += 1;
        totalLeaveDays += studentsOnLeave;
      }

      // format weekday stats sorted Mon..Sun
      const weekdayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const weekday = weekdayOrder.map((k) => {
        const v = weekdayAgg[k];
        if (!v) return { day: k, presentPct: 0, avgMealsPerStudent: 0 };
        return {
          day: k,
          presentPct: Number((v.presentPctSum / v.count).toFixed(2)),
          avgMealsPerStudent: Number((v.avgMealsSum / v.count).toFixed(2)),
        };
      });

      const avgDailyPresencePct = countedDays ? Number((totalPresentPctSum / countedDays).toFixed(2)) : 0;
      const avgMealsPerStudent = countedDays ? Number((totalMealsPerStudentSum / countedDays).toFixed(2)) : 0;

      setDailyStats(daily);
      setWeekdayStats(weekday);
      setKpis({
        avgDailyPresencePct,
        avgMealsPerStudent,
        totalLeaveDays,
      });
    } catch (err) {
      console.error("Attendance analytics load error:", err);
      alert("Failed to load attendance analytics. Check console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // auto-load on mount and when month changes
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  return (
    <div className="min-h-screen font-sans">
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="container-narrow py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Attendance Insights</h1>
          <p className="text-neutral-600 mt-1">
            Manager view: attendance analytics for mess <strong>{messId || "—"}</strong>.
          </p>
        </header>

        <section className="mb-6 flex items-center gap-4">
          <label className="text-sm text-neutral-600">Select month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border px-3 py-2 rounded-md"
          />
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="ml-auto px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatBadge label="Avg Daily Presence" value={`${kpis.avgDailyPresencePct}%`} />
          <StatBadge label="Avg Meals / Student / Day" value={`${kpis.avgMealsPerStudent}`} />
          <StatBadge label="Total Leave Entries" value={kpis.totalLeaveDays} />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-3">Daily Presence (%)</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="presentPct" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-3">Weekday Average Presence</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="presentPct" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Table: daily detail */}
        <section className="mt-8 bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Daily Details</h3>
          {dailyStats.length === 0 ? (
            <p className="text-neutral-500">No attendance data available for the selected month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Date</th>
                    <th className="py-2">Presence %</th>
                    <th className="py-2">Avg Meals / Student</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyStats.map((d) => (
                    <tr key={d.date} className="border-b">
                      <td className="py-2">{d.date}</td>
                      <td className="py-2">{d.presentPct}%</td>
                      <td className="py-2">{d.avgMealsPerStudent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
