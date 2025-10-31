import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BASE_API_URL } from "../utils/base_api_url";
import "../styles/header.css";


export default function Header() {
  const [user, setUser] = useState(null);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      return saved === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [darkMode]);

  useEffect(() => {
    const h = new Headers();
    import("../utils/auth").then(({ authHeader }) => {
      Object.entries(authHeader()).forEach(([k, v]) => h.set(k, v));
      fetch(`${BASE_API_URL}/account`, { headers: h })
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

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => {
      setCollapsed(mq.matches);
      if (!mq.matches) setMenuOpen(false);
    };
    apply();

    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
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
          {user ? (
            <>
            <Link className="nav-btn" to="/requests">Requests</Link>
              {user.role == "APPROVER" ? (<Link className="nav-btn" to="/approver">Approver</Link>) : (<></>)}
              {user.role == "ADMIN" ? 
              (
              <>
                <Link className="nav-btn" to="/admin">Admin</Link>
                <Link className="nav-btn" to="/approver">Approver</Link>
              </>
              ) 
              : 
              (<></>)
              }
              <Link className="account_google-btn" to="/account">Account</Link>
            </>
          ) : (
            <a className="account_google-btn" href={`${BASE_API_URL}/oauth2/authorization/google`}>
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
              {user.role == "ADMIN" ? 
              (
              <>
                <Link className="nav-btn" to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>
                <Link className="nav-btn" to="/approver" onClick={() => setMenuOpen(false)}>Approver</Link>
              </>
              ) 
              : 
              (<></>)
              }
              {user.role == "APPROVER" ? (<Link className="nav-btn" to="/approver" onClick={() => setMenuOpen(false)}>Approver</Link>) : (<></>)}
              <Link className="account_google-btn" to="/account" onClick={() => setMenuOpen(false)}>Account</Link>
            </>
          ) : (
            <a className="account_google-btn" href={`${BASE_API_URL}/oauth2/authorization/google`}>
              Login with Google
            </a>
          )}
        </div>
      )}
    </header>
  );
}
