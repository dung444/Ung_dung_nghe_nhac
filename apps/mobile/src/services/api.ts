import axios from "axios";
import { API_BASE_URL, ENDPOINTS } from "../constants/api";
import { normalizeMediaUrls } from "../utils/media";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  const { useAuthStore } = require("../store/authStore");
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
  (res) => {
    res.data = normalizeMediaUrls(res.data);
    return res;
  },
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { useAuthStore } = require("../store/authStore");
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(ENDPOINTS.refresh, { refreshToken });
        useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        const { useAuthStore } = require("../store/authStore");
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }

    // Global Network & Server Error Notifications
    if (!error.response && (error.message === "Network Error" || error.code === "ERR_NETWORK")) {
      try {
        const { useToastStore } = require("../store/toastStore");
        useToastStore.getState().showError("Mất kết nối máy chủ", "Không thể liên lạc tới máy chủ. Vui lòng kiểm tra kết nối mạng.");
      } catch {}
    } else if (error.response?.status === 403) {
      try {
        const { useToastStore } = require("../store/toastStore");
        useToastStore.getState().showWarning("Từ chối quyền hạn", "Bạn không có quyền thực hiện thao tác này.");
      } catch {}
    } else if (error.response?.status >= 500) {
      try {
        const { useToastStore } = require("../store/toastStore");
        useToastStore.getState().showError("Lỗi hệ thống", "Máy chủ phản hồi sự cố 500. Vui lòng thử lại sau.");
      } catch {}
    }

    return Promise.reject(error);
  }
);
