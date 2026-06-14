import { useState, useEffect } from "react"

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem("theme")
    if (stored) {
      return stored
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark"
    }
    return "light"
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"))
  }

  const setTheme = (newTheme) => {
    if (newTheme === "dark" || newTheme === "light") {
      setThemeState(newTheme)
    }
  }

  return { theme, toggleTheme, setTheme }
}

export default useTheme
