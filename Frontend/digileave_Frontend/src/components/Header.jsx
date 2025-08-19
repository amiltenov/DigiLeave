import React, { useEffect, useState } from "react";
import "../styles/Header.css";

export default function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8080/account", { credentials: "include" })
      .then(r => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="glass-header">
      <div className="logo">
        <img src="/digilogo.png" alt="DigiLeave Logo" className="logo-img" />
        <span className="brand">DigiLeave</span>
      </div>
      <nav>
        <a href="/">Home</a>
        <a href="/requests">Requests</a>
        {user ? (
          <a className="google-btn" href="/account">Account</a>
        ) : (
          <a className="google-btn" href="http://localhost:8080/oauth2/authorization/google">
            Login with Google
          </a>
        )}
      </nav>
    </header>
  );
}
