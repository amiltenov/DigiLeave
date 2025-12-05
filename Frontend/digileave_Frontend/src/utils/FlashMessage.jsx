import { useEffect, useState } from "react";
import "../styles/flash-message.css";

export default function FlashMessage({
  status = "info",   // "ok" | "err" | "warn" | "unauth" | ...
  text,
  duration = 6000,
  onClose,
}) {
  const [closing, setClosing] = useState(false);

  if (!text) return null;

  const raw = String(status || "info").toLowerCase();
  let tone = "info";

  if (raw === "ok" || raw === "success") {
    tone = "success";
  } else if (raw === "err" || raw === "error" || raw === "danger") {
    tone = "error";
  } else if (raw === "warn" || raw === "warning" || raw === "unauth") {
    tone = "warning";
  }

  useEffect(() => {
    if (!duration) return;

    const fadeMs = 220;
    const startCloseAt = Math.max(duration - fadeMs, 0);

    const closeTimer = window.setTimeout(() => {
      setClosing(true);
    }, startCloseAt);

    const removeTimer = window.setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [duration, onClose]);

  const handleManualClose = () => {
    setClosing(true);
    window.setTimeout(() => {
      if (onClose) onClose();
    }, 180);
  };

  const rootClass =
    "flash-message-root flash-message-root--" +
    tone +
    (closing ? " flash-message-root--closing" : "");

  return (
    <div
      className={rootClass}
      style={{ "--flash-message-duration": `${duration}ms` }}
      role="status"
      aria-live="polite"
    >
      <div className="flash-message-inner">
        <div className="flash-message-row">
          <div className="flash-message-dot" />
          <div className="flash-message-text">{text}</div>
          <button
            type="button"
            className="flash-message-close"
            onClick={handleManualClose}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
        <div className="flash-message-progress">
          <div className="flash-message-progress-bar" />
        </div>
      </div>
    </div>
  );
}
