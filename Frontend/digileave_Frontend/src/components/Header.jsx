import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import "../styles/header.css";
import { Link } from "react-router-dom";
import { logout } from "../auth";

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
    const h = new Headers();
    import("../auth").then(({ authHeader }) => {
      Object.entries(authHeader()).forEach(([k, v]) => h.set(k, v));
      fetch("https://digileave.onrender.com/account", { headers: h })
        .then((res) => (res.ok ? res.json() : null))
        .then(setUser)
        .catch(() => setUser(null));
    });
  }, []);

  const headerRef = useRef(null);
  const logoRef = useRef(null);
  const themeRef = useRef(null);
  const navRef = useRef(null);
  const burgerRef = useRef(null);

  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const checkFits = () => {
    const header = headerRef.current;
    if (!header) return;

    const cs = getComputedStyle(header);
    const gap = parseFloat(cs.gap || "0");
    const padL = parseFloat(cs.paddingLeft || "0");
    const padR = parseFloat(cs.paddingRight || "0");

    const logoW = logoRef.current?.getBoundingClientRect().width || 0;
    const themeW = themeRef.current?.getBoundingClientRect().width || 0;
    const navW = navRef.current?.scrollWidth || 0;
    const burgerW = burgerRef.current?.getBoundingClientRect().width || 0;

    const base = padL + padR + logoW + themeW;
    const baseGaps = (() => {
      return 2 * gap;
    })();

    const containerW = header.clientWidth;

    const requiredWithNav = base + navW + baseGaps;

    const requiredWithBurger = base + burgerW + baseGaps;

    const needsCollapse = requiredWithNav > containerW && requiredWithBurger <= containerW
      ? true
      : requiredWithNav > containerW;

    setCollapsed(needsCollapse);
    if (!needsCollapse) setMenuOpen(false);
  };

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(checkFits);

    const header = headerRef.current;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(checkFits);
    });

    if (header) ro.observe(header);
    if (logoRef.current) ro.observe(logoRef.current);
    if (themeRef.current) ro.observe(themeRef.current);
    if (navRef.current) ro.observe(navRef.current);

    const onResize = () => requestAnimationFrame(checkFits);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    const t = setTimeout(checkFits, 50);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return (
    <header className="header" ref={headerRef}>
      <div className="logo-div" ref={logoRef}>
        <img
          src={darkMode ? "/DigiLeaveLogo_WHITE.png" : "/DigiLeaveLogo_BLACK.png"}
          alt="DigiLeave Logo"
          className="logo-img"
        />
      </div>

      <div className="theme-switch" ref={themeRef}>
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
          ref={burgerRef}
          className={`hamburger-btn ${menuOpen ? "is-open" : ""}`}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="hamburger-lines" />
        </button>
      )}


      {!collapsed && (
        <nav ref={navRef}>
          <Link className="nav-btn" to="/">Home</Link>
          <Link className="nav-btn" to="/requests">Requests</Link>
          {user ? (
            <>
              <Link className="account_google-btn" to="/account">Account</Link>
              <button
                className="account_google-btn"
                onClick={() => { logout(); window.location.href = "/"; }}
              >
                Logout
              </button>
            </>
          ) : (
            <a className="account_google-btn" href={"https://digileave.onrender.com/oauth2/authorization/google"}>
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
            <>
              <Link className="account_google-btn" to="/account" onClick={() => setMenuOpen(false)}>Account</Link>
              <button
                className="account_google-btn"
                onClick={() => { setMenuOpen(false); logout(); window.location.href = "/"; }}
              >
                Logout
              </button>
            </>
          ) : (
            <a className="account_google-btn" href={`https://digileave.onrender.com/oauth2/authorization/google`}>
              Login with Google
            </a>
          )}
        </div>
      )}
    </header>
  );
}
