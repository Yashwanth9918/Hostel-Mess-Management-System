import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

const API_URL = `${API_BASE_URL}/api/meal-tokens`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Manager: Generate a QR token for a specific meal + date
export const generateToken = async (date, mealType) => {
  return await axios.post(
    `${API_URL}/generate`,
    { date, mealType },
    getAuthHeaders()
  );
};

// Manager: Get all tokens for a hostel on a date
export const getTokensForDate = async (hostelId, date) => {
  return await axios.get(
    `${API_URL}/${encodeURIComponent(hostelId)}/${date}`,
    getAuthHeaders()
  );
};

// Student: Scan a QR token to mark attendance
export const scanToken = async (token) => {
  return await axios.post(
    `${API_URL}/scan`,
    { token },
    getAuthHeaders()
  );
};

// Manager: Deactivate a token
export const deactivateToken = async (tokenId) => {
  return await axios.put(
    `${API_URL}/${tokenId}/deactivate`,
    {},
    getAuthHeaders()
  );
};
