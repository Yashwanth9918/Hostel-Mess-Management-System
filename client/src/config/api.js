// Centralized API configuration
// This file manages the API base URL for both local and production environments

const getApiBaseUrl = () => {
  // In Vite, environment variables are accessed via import.meta.env
  // VITE_SERVER_URL should be set in .env files
  // For local development: http://localhost:5000
  // For production: your backend Vercel URL or API URL
  
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  
  // Fallback to localhost for development
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  
  // Production fallback - you should set VITE_SERVER_URL in Vercel environment variables
  // This is a safety fallback, but it's better to set the env variable
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to get full API endpoint
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export default API_BASE_URL;

