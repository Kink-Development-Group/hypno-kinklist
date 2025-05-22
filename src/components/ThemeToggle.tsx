import React from "react";

interface ThemeToggleProps {
  theme: string;
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      type="button"
      id="ThemeToggle"
      onClick={toggleTheme}
      title={
        theme === "light" ? "Zum Dark Mode wechseln" : "Zum Light Mode wechseln"
      }
      aria-label={
        theme === "light" ? "Zum Dark Mode wechseln" : "Zum Light Mode wechseln"
      }
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
};

export default ThemeToggle;
