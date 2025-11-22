import React from "react";
import "../../styles/request-detail.css";
import { formatDate } from "../../utils/formatDate";
import { IconCalendar, IconClock, IconClose } from "../../utils/icons";

export default function RequestDetailView({
  open,
  request,
  onClose,
  actions = [],
  title = "Request Details",
}) {
  if (!open || !request) return null;

  const hasActions = Array.isArray(actions) && actions.length > 0;

  const workdays =
    typeof request.workdaysCount === "number" &&
    !Number.isNaN(request.workdaysCount)
      ? request.workdaysCount
      : null;

  const leaveTypeLabel = request.type || "—";

  const status = request.status || "PENDING";
  const statusClass = status.toLowerCase();

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      className="request-detail-root"
      aria-modal="true"
      role="dialog"
      onClick={handleBackdropClick}
    >
      <div
        className="request-detail-card"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="request-detail-header">
          <h2 className="request-detail-title">{title}</h2>
          <button
            type="button"
            className="request-detail-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <IconClose />
          </button>
        </header>

        <div className="request-detail-body">
          {(request.userName || request.userEmail) && (
            <section className="request-detail-section request-detail-requester">
              <div className="request-detail-section-label">Requester</div>
              <div className="request-detail-requester-info">
                <div className="request-detail-requester-name">
                  {request.userName || "—"}
                </div>
                {request.userEmail && (
                  <div className="request-detail-user-email">
                    {request.userEmail}
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="request-detail-section">
            <div className="request-detail-info-grid" role="list">
              <article className="request-detail-info-card" role="listitem">
                <div className="request-detail-info-label">
                  <IconCalendar className="request-detail-info-icon" />
                  <span>Start date</span>
                </div>
                <div className="request-detail-info-value">
                  {formatDate(request.startDate)}
                </div>
              </article>

              <article className="request-detail-info-card" role="listitem">
                <div className="request-detail-info-label">
                  <IconCalendar className="request-detail-info-icon" />
                  <span>End date</span>
                </div>
                <div className="request-detail-info-value">
                  {formatDate(request.endDate)}
                </div>
              </article>

              <article className="request-detail-info-card" role="listitem">
                <div className="request-detail-info-label">
                  <IconClock className="request-detail-info-icon" />
                  <span>Duration</span>
                </div>
                <div className="request-detail-info-value request-detail-duration-value">
                  {workdays ?? "—"}
                  {workdays != null && (
                    <span className="request-detail-duration-unit">
                      workdays
                    </span>
                  )}
                </div>
              </article>

              <article className="request-detail-info-card" role="listitem">
                <div className="request-detail-info-label">
                  <span>Leave type</span>
                </div>
                <div className="request-detail-info-value">
                  {leaveTypeLabel}
                </div>
              </article>
            </div>
          </section>

          {request.comment && (
            <section className="request-detail-section">
              <div className="request-detail-section-label">Comment</div>
              <div className="request-detail-comment">{request.comment}</div>
            </section>
          )}

          {(request.createdAt || request.decidedAt) && (
            <section className="request-detail-section request-detail-timestamps">
              {request.createdAt && (
                <div className="request-detail-timestamp">
                  <span className="request-detail-timestamp-label">
                    Created:
                  </span>
                  <span className="request-detail-timestamp-value">
                    {formatDate(request.createdAt)}
                  </span>
                </div>
              )}

              {request.decidedAt && (
                <div className="request-detail-timestamp">
                  <span className="request-detail-timestamp-label">
                    Decided:
                  </span>
                  <span className="request-detail-timestamp-value">
                    {formatDate(request.decidedAt)}
                  </span>
                </div>
              )}
            </section>
          )}
        </div>

        <footer
          className={
            "request-detail-footer" +
            (hasActions ? "" : " request-detail-footer--no-actions")
          }
        >
          <div className="request-detail-status">
            <span
              className={`request-detail-status-badge request-detail-status-badge--${statusClass}`}
            >
              {status}
            </span>
          </div>

          {hasActions && (
            <div className="request-detail-actions">
              {actions.map((action, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={
                    "request-detail-action-button" +
                    (action.variant
                      ? ` request-detail-action-button--${action.variant}`
                      : "")
                  }
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
