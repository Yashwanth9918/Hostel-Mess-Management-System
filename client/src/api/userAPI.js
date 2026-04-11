import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

const BASE_URL = API_BASE_URL;

export const getStudentCount = async (messId) => {
  const token = localStorage.getItem("token");
  return await axios.get(`${BASE_URL}/api/users/count`, {
    params: { messId },
    headers: { Authorization: `Bearer ${token}` },
  });
};
