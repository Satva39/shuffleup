const configuredBase = typeof import.meta.env.VITE_API_URL === "string"
  ? import.meta.env.VITE_API_URL.trim()
  : "";

const defaultBase = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://shuffleup-backend.onrender.com";

export const API_BASE_URL = (configuredBase || defaultBase).replace(/\/+$/, "");
