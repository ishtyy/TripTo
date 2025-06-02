// frontend/src/services/api.js

import axios from "axios";

// Adjust this baseURL if your Express server runs somewhere else (e.g. production).
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// If your login/register endpoints return a JWT, we want to attach it automatically:
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tripto_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
