import { create } from "zustand";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem("chat-theme");
  return savedTheme || "coffee"; // Default to coffee theme if not set
};

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
}));