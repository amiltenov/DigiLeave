import React, { useEffect, useRef, useState } from "react";
import "../styles/header.css";
import { Link } from "react-router-dom";

export default function Header() {
  const [user, setUser] = useState(null);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

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


  const headerRef = useRef(null);
  const navRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const el = headerRef.current;

    const checkCollapse = () => {
      if (!el) return;
      const needsCollapse = el.scrollWidth - 1 > el.clientWidth;
      setCollapsed(needsCollapse);
      if (!needsCollapse) setMenuOpen(false);
    };

    const ro = new ResizeObserver(checkCollapse);
    if (el) ro.observe(el);

    window.addEventListener("resize", checkCollapse);
    checkCollapse();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", checkCollapse);
    };
  }, []);

  return (
    <header className="header" ref={headerRef}>
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

      {collapsed && (
        <button
          className={`hamburger-btn ${menuOpen ? "is-open" : ""}`}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(o => !o)}
        >
          <span className="hamburger-lines" />
        </button>
      )}


      {!collapsed && (
        <nav ref={navRef}>
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
      )}

      {collapsed && (
        <div
          id="mobile-menu"
          className={`mobile-drawer ${menuOpen ? "open" : ""}`}
          role="menu"
        >
          <Link className="nav-btn" to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link className="nav-btn" to="/requests" onClick={() => setMenuOpen(false)}>Requests</Link>
          {user ? (
            <Link className="account_google-btn" to="/account" onClick={() => setMenuOpen(false)}>Account</Link>
          ) : (
            <a className="account_google-btn" href="http://localhost:8080/auth" onClick={() => setMenuOpen(false)}>
              Login with Google
            </a>
          )}
        </div>
      )}
    </header>
  );
}
