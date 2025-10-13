import React, { useMemo, useState } from "react";
import "../styles/requests-view.css";
import RequestDetailView from "./RequestDetailView";
import { formatDate } from "../utils/formatDate";
import { BASE_API_URL } from "../utils/base_api_url";

const toTitle = (s) =>
  (s || "").toString().replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
const safeNum = (v, fb = 0) => (typeof v === "number" && !Number.isNaN(v) ? v : fb);
const statusKey = (s) => String(s || "").toLowerCase();
const isSubmitted = (s) => statusKey(s) === "submitted";

const Icon = {
  // slightly nicer calendar (rounded header + dots)
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}>
      <g fill="currentColor">
        <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v12A2.5 2.5 0 0 1 19.5 21h-15A2.5 2.5 0 0 1 2 18.5v-12A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1zm12.5 6.5v-2A.5.5 0 0 0 19 6H5a.5.5 0 0 0-.5.5v2H19.5zM5 10h14v8.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V10z"/>
        <circle cx="8" cy="13.5" r="1"/>
        <circle cx="12" cy="13.5" r="1"/>
        <circle cx="16" cy="13.5" r="1"/>
      </g>
    </svg>
  ),
  Eye: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" {...p}>
      <path
        fill="currentColor"
        d="M12 5c5 0 9 4 10 7-1 3-5 7-10 7S3 15 2 12c1-3 5-7 10-7zm0 2C8.7 7 5.9 9.2 4.5 12 5.9 14.8 8.7 17 12 17s6.1-2.2 7.5-5C18.1 9.2 15.3 7 12 7zm0 3a2 2 0 110 4 2 2 0 010-4z"
      />
    </svg>
  ),
};

export default function RequestsViewMode({
  items,
  normalize,
  sortBy,
  sortOrder = "desc",
  view,
  onChangeView,
  onSelectRow,
  role = "user",
  apiOrigin = BASE_API_URL,
  authHeader,
  onAfterAction,
  endpoints = {},
}) {
  const [detail, setDetail] = useState(null);
  const [locallySeen, setLocallySeen] = useState(() => new Set());

  const rows = useMemo(() => {
    const map = (r) =>
      normalize
        ? normalize(r)
        : {
            ...r,
            startDate: r.startDate ?? r.start_date ?? r.start ?? r.from,
            endDate: r.endDate ?? r.end_date ?? r.end ?? r.to,
            workdays: r.workdaysCount ?? r.workdays ?? r.duration ?? 0,
            leaveType: toTitle(r.type ?? r.leaveType ?? ""),
            status: statusKey(r.status),
            isUnseen: r.decision_seen === false && !locallySeen.has(r.id),
            submittedAt:
              r.createdAt ?? r.created_at ?? r.startDate ?? r.start_date,
            comment: r.comment ?? "",
          };

    const list = (items || []).map(map);

    const dir = sortOrder === "asc" ? 1 : -1;

    const byRecent = (a, b) => {
      const ta = new Date(a.submittedAt || a.startDate).getTime() || 0;
      const tb = new Date(b.submittedAt || b.startDate).getTime() || 0;
      return (tb - ta) * (sortOrder === "asc" ? -1 : 1);
    };

    const byStatus = (a, b) => {
      const pri = { submitted: 0, approved: 1, denied: 2, rejected: 2, cancelled: 3, canceled: 3 };
      const diff = (pri[a.status] ?? 99) - (pri[b.status] ?? 99);
      if (diff !== 0) return diff * dir;
      return byRecent(a, b);
    };

    const byPendingFirst = (a, b) => {
      const A = a.status === "submitted";
      const B = b.status === "submitted";
      if (A && !B) return -1;
      if (!A && B) return 1;
      return byRecent(a, b);
    };

    return list.sort((a, b) => {
      if (a.isUnseen && !b.isUnseen) return -1;
      if (!a.isUnseen && b.isUnseen) return 1;
      if (sortBy === "status") return byStatus(a, b);
      if (sortBy === "pending-first") return byPendingFirst(a, b);
      return byRecent(a, b);
    });
  }, [items, normalize, sortBy, sortOrder, locallySeen]);

  // endpoints
  const urlCancel = (id) => endpoints.cancel?.(id) || `${apiOrigin}/requests/${id}/cancel`;
  const urlDecide = (id, action) => {
    const targetRole = role === "admin" ? "admin" : "approver";
    const base =
      action === "APPROVED"
        ? endpoints.approve?.(id, targetRole)
        : endpoints.reject?.(id, targetRole);
    return base || `${apiOrigin}/${targetRole}/request/${id}`;
  };
  const urlMarkSeen = (id) =>
    endpoints.markSeen?.(id) || `${apiOrigin}/requests/${id}/decision-seen`;

  async function cancelRequest(row) {
    try {
      const res = await fetch(urlCancel(row.id), {
        method: "PATCH",
        headers: { ...(authHeader?.() || {}) },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      onAfterAction?.(updated);
      setDetail((d) => (d?.id === updated.id ? updated : d));
    } catch (e) {
      console.error(e);
    }
  }

  async function decideRequest(row, action) {
    try {
      const res = await fetch(urlDecide(row.id, action), {
        method: "PATCH",
        headers: { ...(authHeader?.() || {}), "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      onAfterAction?.(updated);
      setDetail((d) => (d?.id === updated.id ? updated : d));
    } catch (e) {
      console.error(e);
    }
  }

  async function markDecisionSeen(row) {
    try {
      setLocallySeen((prev) => new Set(prev).add(row.id)); // optimistic
      const res = await fetch(urlMarkSeen(row.id), {
        method: "PATCH",
        headers: { ...(authHeader?.() || {}) },
      });
      if (res.ok) {
        let updated;
        try {
          updated = await res.json();
        } catch {
          updated = { ...row, decision_seen: true };
        }
        onAfterAction?.({ ...row, ...updated, decision_seen: true });
        setDetail((d) => (d?.id === row.id ? { ...d, decision_seen: true } : d));
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleOpen(row) {
    if (row?.isUnseen) markDecisionSeen(row);
    setDetail(row);
    onSelectRow?.(row);
  }

  const Badge = ({ status, children }) => {
    const k = statusKey(status);
    return <span className={`rq-badge rq-badge--${k}`}>{children ?? toTitle(status)}</span>;
  };

  const NewPill = () => (
    <span className="rq-new-pill">
      <Icon.Eye />
      NEW
    </span>
  );

  // ===== Cards =====
  const Card = ({ r }) => {
    const cancelled = r.status === "cancelled" || r.status === "canceled";
    return (
      <div
        className={`rq-card rv-clickable ${cancelled ? "is-cancelled" : ""}`}
        onClick={() => handleOpen(r)}
      >
        {/* pin status top-right */}
        <div className="rq-card__head">
          <div className="rq-card__head-left">
            <div className="rq-avatar" aria-hidden="true">
              {((r.userName || "").match(/\b\w/g) || ["U", "S"]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="rq-card__title">
              <div className="rq-card__name">{r.userName || "Request"}</div>
              {r.userEmail && <div className="rq-card__email">{r.userEmail}</div>}
            </div>
          </div>

          {/* status pill now inline with the title row */}
          <div className="rq-card__status">
            <Badge status={r.status} />
          </div>
        </div>

        <div className="rq-card__dates">
          <span className="rq-datechip"><Icon.Calendar /></span>
          {formatDate(r.startDate)} <span>→</span> {formatDate(r.endDate)}
        </div>

        <div className="rq-card__meta">
          <span className="rq-card__type">{r.leaveType}</span>
          <span className="rq-card__dot" />
          <span className="rq-card__days">
            {safeNum(r.workdays)} <em>days</em>
          </span>
        </div>

        {r.comment && <div className="rq-card__comment">“{r.comment}”</div>}
      </div>
    );
  };

  // ===== Compact =====
  const CompactRow = ({ r }) => {
    const cancelled = r.status === "cancelled" || r.status === "canceled";
    return (
      <div
        className={`rq-compact rv-clickable ${r.isUnseen ? "rq-compact--new" : ""} ${
          cancelled ? "is-cancelled" : ""
        }`}
        onClick={() => handleOpen(r)}
      >
        {r.isUnseen && <NewPill />}
        <div className="rq-compact__avatar">
          {((r.userName || "").match(/\b\w/g) || ["U", "S"]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div className="rq-compact__body">
          <div className="rq-compact__top">
            <span className="rq-compact__name">{r.userName || "Request"}</span>
            <Badge status={r.status} />
          </div>
          <div className="rq-compact__sub">
            <span className="rq-datechip"><Icon.Calendar /></span>
            <span>
              {formatDate(r.startDate)} — {formatDate(r.endDate)}
            </span>
            <span className="rq-dot" />
            <span>{safeNum(r.workdays)}d</span>
            <span className="rq-dot" />
            <span className="rq-ellipsis">{r.leaveType}</span>
          </div>
        </div>
      </div>
    );
  };

  // ===== Table =====
  const TableView = () => (
    <div className="rq-tablewrap">
      <div className="rq-scroll">
        <table className="rq-table">
          <thead>
            <tr>
              <th aria-label="new" />
              <th scope="col">Start Date</th>
              <th scope="col">End Date</th>
              <th scope="col">Duration</th>
              <th scope="col">Type</th>
              <th scope="col">Comment</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const cancelled = r.status === "cancelled" || r.status === "canceled";
              return (
                <tr
                  key={r.id}
                  className={`${r.isUnseen ? "rq-row--new" : ""} ${cancelled ? "is-cancelled" : ""}`}
                  onClick={() => handleOpen(r)}
                >
                  <td>{r.isUnseen ? <span className="rq-dot rq-dot--pulse" /> : null}</td>
                  <td className="rq-nowrap">
                    <span className="rq-datechip"><Icon.Calendar /></span>
                    {formatDate(r.startDate)}
                  </td>
                  <td className="rq-nowrap">
                    <span className="rq-datechip"><Icon.Calendar /></span>
                    {formatDate(r.endDate)}
                  </td>
                  <td>
                    <span className="rq-days">
                      {safeNum(r.workdays)} <em>days</em>
                    </span>
                  </td>
                  <td>{r.leaveType}</td>
                  <td className="rq-ellipsis">{r.comment || "—"}</td>
                  <td>
                    <div className="rq-statuscell">
                      <span>
                        <span className={`rq-badge rq-badge--${statusKey(r.status)}`}>
                          {toTitle(r.status)}
                        </span>
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      {view === "cards" && (
        <div className="rq-grid">
          {rows.map((r) => (
            <Card key={r.id} r={r} />
          ))}
        </div>
      )}
      {view === "table" && <TableView />}
      {view === "compact" && (
        <div className="rq-list">
          {rows.map((r) => (
            <CompactRow key={r.id} r={r} />
          ))}
        </div>
      )}

      <RequestDetailView
        open={!!detail}
        request={detail}
        onClose={() => setDetail(null)}
        actions={
          !detail
            ? []
            : isSubmitted(detail.status)
            ? role === "user"
              ? [{ label: "Cancel", variant: "reject", onClick: () => cancelRequest(detail) }]
              : [
                  { label: "Approve", variant: "approve", onClick: () => decideRequest(detail, "APPROVED") },
                  { label: "Reject", variant: "reject", onClick: () => decideRequest(detail, "REJECTED") },
                ]
            : []
        }
      />
    </>
  );
}
