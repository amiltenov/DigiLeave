import React, { useEffect, useState } from "react";
import "../styles/header.css";
import { Link } from "react-router-dom";

export default function Header() {
  const [user, setUser] = useState(null);

  // ✅ initialize from localStorage or prefers-color-scheme
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // ✅ keep document + localStorage in sync
  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [darkMode]);

  useEffect(() => {
    fetch("http://localhost:8080/account", { credentials: "include" })
      .then(res => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="header">
      <div className="logo-div">
        <img
          src={darkMode ? "/DigiLeaveLogo_WHITE.png" : "/DigiLeaveLogo_BLACK.png"}
          alt="DigiLeave Logo"
          className="logo-img"
        />
      </div>

      <div className="theme-switch">
        <input
          type="checkbox"
          id="switch"
          checked={darkMode}
          onChange={() => setDarkMode(!darkMode)}
        />
        <label htmlFor="switch" className="slider"></label>
      </div>

      <nav>
  <Link className="nav-btn" to="/">Home</Link>
  <Link className="nav-btn" to="/requests">Requests</Link>
  {user ? (
    <Link className="account_google-btn" to="/account">Account</Link>
  ) : (
    <a className="account_google-btn" href="http://localhost:8080/auth">
      Login with Google
    </a>
  )}
</nav>
    </header>
  );
}
