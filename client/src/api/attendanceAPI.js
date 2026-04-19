import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

const API_URL = `${API_BASE_URL}/api/attendance`;

// Include JWT token from localStorage if you use login
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Register leave
export const registerLeave = async (leaveData) => {
  return await axios.post(`${API_URL}/leave`, leaveData, getAuthHeaders());
};

// Get user's attendance history
export const getMyAttendance = async (startDate, endDate) => {
  return await axios.get(`${API_URL}/my-attendance?startDate=${startDate}&endDate=${endDate}`, getAuthHeaders());
};

//  Cancel a leave (calls PUT /cancel-leave/:id)
export const cancelLeave = async (attendanceId) => {
  return await axios.put(`${API_URL}/cancel-leave/${attendanceId}`, {}, getAuthHeaders());
};

// Manager: Get monthly attendance analytics (single aggregation)
export const getMessMonthlyStats = async (hostelId, month, year) => {
  return await axios.get(
    `${API_URL}/mess-monthly/${encodeURIComponent(hostelId)}/${month}/${year}`,
    getAuthHeaders()
  );
};
