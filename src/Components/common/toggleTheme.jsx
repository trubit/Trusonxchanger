import { useState, useEffect } from "react";
import { Sun, Moon } from "react-bootstrap-icons";
import "../../styles/toggleTheme.css";

// Theme toggle button for light/dark mode.
const ToggleTheme = () => {
  // Start with dark mode by default (you can change to false for light)
  const [isDark, setIsDark] = useState(true);

  // Apply theme whenever isDark changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((prev) => !prev)}
      className="button-toggle"
      style={{
        background: isDark ? " rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
        color: isDark ? "white" : "black",
      }}
      aria-label="Toggle dark/light mode"
    >
      {isDark ? <Sun size={24} /> : <Moon size={24} />}
    </button>
  );
};

export default ToggleTheme;
