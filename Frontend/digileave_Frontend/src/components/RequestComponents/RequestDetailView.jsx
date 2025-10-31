import React from "react";
import "../../styles/request-detail.css";
import { formatDate } from "../../utils/formatDate";

const toTitle = (s) =>
  (s || "")
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

const safeNum = (v, fb = 0) =>
  typeof v === "number" && !Number.isNaN(v) ? v : fb;

const statusTone = (status) => {
  switch ((status || "").toLowerCase()) {
    case "approved":
      return "approved";
    case "denied":
    case "rejected":
      return "denied";
    default:
      return "pending";
  }
};

const Icon = {
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M7 2h2v2h6V2h2v2h3a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h3V2zm14 8H3v10h18V10zM3 8h18V6H3v2z" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 11h5v-2h-4V6h-2v7z" />
    </svg>
  ),
  Close: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M18.3 5.71L12 12.01l-6.3-6.3-1.4 1.41 6.29 6.3-6.3 6.3 1.41 1.41 6.3-6.29 6.29 6.29 1.41-1.41-6.3-6.3 6.3-6.3z"/>
    </svg>
  ),
};

const Badge = ({ status, children }) => {
  const tone = statusTone(status);
  return (
    <span className={`rd-badge rd-badge--${tone}`}>
      {children ?? toTitle(status)}
    </span>
  );
};

export default function RequestDetailView({
  open,
  request,
  onClose,
  actions = [],
  title = "Request Details",
}) {
  if (!open || !request) return null;

  return (
    <div className="rd-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="rd-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rd-head">
          <h2>{title}</h2>
          <button className="rd-close" onClick={onClose} aria-label="Close">
            <Icon.Close />
          </button>
        </div>

        <div className="rd-body">
          {(request.userName || request.userEmail) && (
            <div className="rd-card rd-card--one">
              <div className="rd-label">Requester</div>
              <div className="rd-value">
                <div className="rd-strong">{request.userName || "—"}</div>
                {request.userEmail && <div className="rd-muted rd-email">{request.userEmail}</div>}
              </div>
            </div>
          )}

          <div className="rd-grid">
            <div className="rd-card">
              <div className="rd-label"><Icon.Calendar /> Start Date</div>
              <div className="rd-value">{formatDate(request.startDate)}</div>
            </div>
            <div className="rd-card">
              <div className="rd-label"><Icon.Calendar /> End Date</div>
              <div className="rd-value">{formatDate(request.endDate)}</div>
            </div>
            <div className="rd-card">
              <div className="rd-label"><Icon.Clock /> Duration</div>
              <div className="rd-value rd-big">
                {safeNum(request.workdaysCount)} <span>workdays</span>
              </div>
            </div>
            <div className="rd-card">
              <div className="rd-label">Leave Type</div>
              <div className="rd-value">{toTitle(request.type || "")}</div>
            </div>
          </div>

          {request.comment && (
            <div className="rd-comment">
              <div className="rd-label">Comment</div>
              <div className="rd-commentbox">{request.comment}</div>
            </div>
          )}

          <div className="rd-times">
            {request.createdAt && (
              <div>
                <span>Created:</span>{" "}
                <strong>{formatDate(request.createdAt)}</strong>
              </div>
            )}
            {request.decidedAt && (
              <div>
                <span>Decided:</span>{" "}
                <strong>{formatDate(request.decidedAt)}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="rd-foot" style={{ justifyContent: actions.length ? "space-between" : "flex-end" }}>
          <Badge status={request.status} />
          {actions.length > 0 && (
            <div className="rd-actions">
              {actions.map((a, i) => (
                <button
                  key={i}
                  onClick={a.onClick}
                  disabled={a.disabled}
                  className={`rd-btn ${a.variant ? `rd-btn--${a.variant}` : ""}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
