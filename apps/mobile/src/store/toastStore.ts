import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  timestamp: Date;
  category?: "SYSTEM" | "AUDIO" | "PAYMENT" | "QUEUE" | "AUTH";
  read?: boolean;
}

interface ToastState {
  currentToast: ToastMessage | null;
  history: ToastMessage[];
  showToast: (type: ToastType, title: string, message?: string, options?: { duration?: number; category?: ToastMessage["category"] }) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  hideToast: () => void;
  clearHistory: () => void;
  markAllRead: () => void;
}

let timeoutId: any = null;

export const useToastStore = create<ToastState>((set, get) => ({
  currentToast: null,
  history: [
    {
      id: "init-1",
      type: "info",
      title: "Chào mừng tới Waifu Player",
      message: "Hệ thống âm nhạc không bản quyền có lời & không lời chất lượng cao đã sẵn sàng.",
      timestamp: new Date(Date.now() - 3600000 * 2),
      category: "SYSTEM",
      read: true,
    },
    {
      id: "init-2",
      type: "success",
      title: "Hàng đợi phát sau đã kích hoạt",
      message: "Bạn có thể bấm biểu tượng đồng hồ trên bất kỳ bài hát nào để đưa vào hàng đợi.",
      timestamp: new Date(Date.now() - 3600000),
      category: "QUEUE",
      read: true,
    },
    {
      id: "init-3",
      type: "info",
      title: "Hệ thống thanh toán tự động QR",
      message: "Nạp và rút tiền cho Creator đã được kết nối với tài khoản ngân hàng bảo mật.",
      timestamp: new Date(Date.now() - 1800000),
      category: "PAYMENT",
      read: false,
    },
  ],

  showToast: (type, title, message, options) => {
    if (timeoutId) clearTimeout(timeoutId);

    const newToast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      message,
      duration: options?.duration ?? (type === "error" ? 4000 : 3000),
      timestamp: new Date(),
      category: options?.category ?? (type === "error" ? "SYSTEM" : "QUEUE"),
      read: false,
    };

    set((state) => ({
      currentToast: newToast,
      history: [newToast, ...state.history.slice(0, 49)], // Keep up to 50 items
    }));

    timeoutId = setTimeout(() => {
      set({ currentToast: null });
    }, newToast.duration);
  },

  showSuccess: (title, message) => {
    get().showToast("success", title, message, { category: "QUEUE" });
  },

  showError: (title, message) => {
    get().showToast("error", title, message, { category: "SYSTEM", duration: 4500 });
  },

  showWarning: (title, message) => {
    get().showToast("warning", title, message, { category: "AUTH" });
  },

  showInfo: (title, message) => {
    get().showToast("info", title, message, { category: "AUDIO" });
  },

  hideToast: () => {
    if (timeoutId) clearTimeout(timeoutId);
    set({ currentToast: null });
  },

  clearHistory: () => {
    set({ history: [] });
  },

  markAllRead: () => {
    set((state) => ({
      history: state.history.map((item) => ({ ...item, read: true })),
    }));
  },
}));
