import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

const API = `${API_BASE_URL}/api/bills`;

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// Get current student's bills with optional query params: { year, page, limit, paymentStatus }
export const getMyBills = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const url = `${API}/my-bills${qs ? `?${qs}` : ""}`;
  return axios.get(url, authHeaders());
};
export const markBillsAsPaid = async (billIds) => {
  return axios.put(`${API}/mark-paid`, { billIds }, authHeaders());
};
// Get total count of students in database

export const getTotalStudentCount = async () => {
  const token = localStorage.getItem("token");
  return axios.get(
    `${BASE}/api/bills/students-count`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Get all bills stats (not filtered by mess) - all bills in database 
export const getAllBillsStats = async () => {
  const token = localStorage.getItem("token");
  return axios.get(
    `${BASE}/api/bills/stats-all`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
};





// Admin: generate bills for all students (used by GenerateBills page)
export const generateAllBills = async (payload) => {
  return axios.post(`${API}/generate-all`, payload, authHeaders());
};

// Admin/Manager: Get bills for a mess (server: GET /api/bills/mess/:messId)
export const getMessBills = async (messId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const url = `${API}/mess/${messId}${qs ? `?${qs}` : ""}`;
  return axios.get(url, authHeaders());
};

// Get billing stats for admin dashboard
export const getBillingStats = async (messId) => {
  if (!messId) {
    throw new Error('MessId is required for getting billing stats');
  }
  
  // Get current month and year
  const today = new Date();
  const month = today.getMonth() + 1; // getMonth returns 0-11
  const year = today.getFullYear();
  
  return axios.get(`${API}/summary/${messId}/${month}/${year}`, authHeaders());

};
