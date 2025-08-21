import { useEffect, useState } from "react";
import "../styles/footer.css";

export default function Footer() {
  const [darkMode, setDarkMode] = useState(
    document.documentElement.getAttribute("data-theme") === "dark"
  );

  useEffect(() => {
    // observe theme changes
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.getAttribute("data-theme") === "dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="footer">
      {/* <div className="logof-div">
        <img
          src={darkMode ? "/DigiLeaveLogo_WHITE.png" : "/DigiLeaveLogo_BLACK.png"}
          alt="DigiLeave Logo"
          className="logof-img"
        />
      </div> */}
      {/* <div className="routes">
        Routes:
        <a href="/">Home</a>
        <a href="/account">Account</a>
        <a href="/requests">Requests</a>
      </div> */}
{/* 
      <div className="contact-info">
        <b>Contact Information:</b>
        <a href="mailto:miltenoval@digitoll.bg">miltenoval@digitoll.bg</a>
        <a href="mailto:belchinovh@digitoll.bg">belchinovh@digitoll.bg</a>
      </div> */}

      <p>© {new Date().getFullYear()} DigiLeave. All rights reserved.</p>
    </footer>
  );
}
