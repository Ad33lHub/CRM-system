import { useState, useEffect } from "react"

export function useTheme() {
  const theme = "dark";

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  const toggleTheme = () => {};
  const setTheme = () => {};

  return { theme, toggleTheme, setTheme };
}

export default useTheme
