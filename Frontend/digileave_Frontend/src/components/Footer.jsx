import { useEffect, useState } from "react";
import "../styles/footer.css";

export default function Footer() {
  const [isDark, setIsDark] = useState(
    document.documentElement.getAttribute("data-theme") === "dark"
  );

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return (
    <footer className="site-footer">
      
      <div className="footer-inner">
        <div className="footer-brand">
          <img
            src={isDark ? "/DigiLeaveLogo_WHITE.png" : "/DigiLeaveLogo_BLACK.png"}
            alt="DigiLeave"
            className="footer-logo"
          />
        </div>

        <nav className="footer-links" aria-label="Routes">
          <div className="footer-title">Routes</div>
          <a href="/">Home</a>
          <a href="/account">Account</a>
          <a href="/requests">Requests</a>
        </nav>

        <div className="footer-contact">
          <div className="footer-title">Contact</div>
          <a href="mailto:miltenoval@digitoll.bg">miltenoval@digitoll.bg</a>
          <a href="mailto:belchinovh@digitoll.bg">belchinovh@digitoll.bg</a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} DigiLeave. All rights reserved.</p>
      </div>
    </footer>
  );
}
