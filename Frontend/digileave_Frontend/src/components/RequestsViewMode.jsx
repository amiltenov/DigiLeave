import React, { useMemo, useState, useEffect } from "react";
import "../styles/requests-view.css";
import RequestDetailView from "./RequestDetailView";
import { formatDate } from "../utils/formatDate";
import { BASE_API_URL } from "../utils/base_api_url";
import { getInitials } from "../utils/getInitials";
import { IconCalendar, IconEye } from "../utils/icons";

/**
 * Props:
 * - items: Array<Request>
 * - sortBy: "recent" | "start-date" | "pending-first"
 * - sortOrder: "asc" | "desc"
 * - view: "cards" | "table" | "compact"
 * - role: "user" | "approver" | "admin"
 * - apiOrigin, authHeader
 * - onSelectRow(row), onAfterAction(updatedRow)
 * - endpoints: { cancel(id), approve(id, role), reject(id, role), markSeen(id) }
 */
export default function RequestsViewMode({
  items,
  sortBy = "recent",
  sortOrder = "desc",
  view = "cards",
  role = "user",
  apiOrigin = BASE_API_URL,
  authHeader,
  onSelectRow,
  onAfterAction,
  endpoints = {},
}) {
  const [detail, setDetail] = useState(null);
  const [accountName, setAccountName] = useState("");

  // fetch /account once for the avatar initials fallback
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${apiOrigin}/account`, { headers: { ...(authHeader?.() || {}) } });
        if (!res.ok) return;
        const json = await res.json();
        if (mounted && json?.fullName) setAccountName(String(json.fullName));
      } catch {/* ignore */}
    })();
    return () => { mounted = false; };
  }, [apiOrigin, authHeader]);

// …imports and component setup unchanged…

const rows = useMemo(() => {
  const list = Array.isArray(items) ? items : [];

  const byRecent = (a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortOrder === "asc" ? ta - tb : tb - ta;
  };

  const byStartDate = (a, b) => {
    const ta = a.startDate ? new Date(a.startDate).getTime() : 0;
    const tb = b.startDate ? new Date(b.startDate).getTime() : 0;
    return sortOrder === "asc" ? tb - ta : ta - tb;
  };

  const byPendingFirst = (a, b) => {
    const A = String(a.status).toUpperCase() === "PENDING";
    const B = String(b.status).toUpperCase() === "PENDING";
    if (A && !B) return -1;
    if (!A && B) return 1;
    return byRecent(a, b);
  };

  const sorted = [...list].sort((a, b) => {
    // keep unseen first
    if (a.decision_seen === false && b.decision_seen !== false) return -1;
    if (a.decision_seen !== false && b.decision_seen === false) return 1;

    if (sortBy === "start-date")   return byStartDate(a, b);
    if (sortBy === "pending-first")return byPendingFirst(a, b);
    return byRecent(a, b); // default "recent"
  });

  return sorted;
}, [items, sortBy, sortOrder]);


  // endpoints
  const urlCancel  = (id) => endpoints.cancel?.(id) || `${apiOrigin}/requests/${id}/cancel`;
  const urlDecide  = (id, action) => {
    const target = role === "admin" ? "admin" : "approver";
    return (action === "APPROVED"
      ? endpoints.approve?.(id, target)
      : endpoints.reject?.(id, target)) || `${apiOrigin}/${target}/request/${id}`;
  };
  const urlMarkSeen = (id) => endpoints.markSeen?.(id) || `${apiOrigin}/requests/${id}/decision-seen`;

  async function cancelRequest(row) {
    try {
      const res = await fetch(urlCancel(row.id), { method: "PATCH", headers: { ...(authHeader?.() || {}) } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      onAfterAction?.(updated);
      setDetail((d) => (d?.id === updated.id ? updated : d));
    } catch (e) { console.error(e); }
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
    } catch (e) { console.error(e); }
  }

  async function markDecisionSeen(row) {
    try {
      const res = await fetch(urlMarkSeen(row.id), {
        method: "PATCH",
        headers: { ...(authHeader?.() || {}) },
      });
      if (res.ok) {
        let updated;
        try { updated = await res.json(); } catch { updated = { ...row, decision_seen: true }; }
        onAfterAction?.(updated);
        setDetail((d) => (d?.id === row.id ? { ...d, decision_seen: true } : d));
      }
    } catch (e) { console.error(e); }
  }

  function openDetail(row) {
    if (row?.decision_seen === false) markDecisionSeen(row);
    setDetail(row);
    onSelectRow?.(row);
  }

  const Badge = ({ status }) => {
    const s = String(status).toLowerCase(); // for CSS class only
    const cls =
      s === "approved"  ? "approved"  :
      s === "rejected"  ? "rejected"  :
      s === "cancelled"  ? "cancelled" : 
      "pending";
    return <span className={`request-badge request-badge--${cls}`}>{String(status)}</span>;
  };

  const NewPill = () => (
    <span className="request-new">
      <IconEye /> NEW
    </span>
  );

  // ── Cards ───────────────────────────────────────────────────
  const Card = ({ r }) => {
    const cancelled = String(r.status).toUpperCase() === "CANCELED";
    const displayName = r.userName || accountName || "Request";
    const initials = getInitials(displayName, r.userEmail);

    return (
      <div className={`request-card ${cancelled ? "is-cancelled" : ""}`} onClick={() => openDetail(r)}>
        {r.decision_seen === false && <NewPill />}

        <header className="request-card-head">
          <div className="request-card-identity">
            <div className="request-avatar">{initials}</div>
            <div className="request-card-title">
              <div className="request-name">{displayName}</div>
              {r.userEmail && <div className="request-email">{r.userEmail}</div>}
            </div>
          </div>
          <Badge status={r.status} />
        </header>

        <div className="request-dates">
          <div className="request-dates-left">
            <span className="request-cal"><IconCalendar /></span>
            {formatDate(r.startDate)} <span>→</span> {formatDate(r.endDate)}
          </div>
          <div className="request-days">
            {r.workdaysCount} <em>days</em>
          </div>
        </div>

        <div className="request-meta">
          <span className="request-type">{String(r.type).replace(/_/g, " ").toLowerCase()}</span>
        </div>

        <div className="cancel-inline">
          <div className="request-comment">{r.comment || "No Comment."}</div>
          
        </div>
          
      </div>
    );
  };

  // ── Compact ─────────────────────────────────────────────────
  const CompactRow = ({ r }) => {
    const cancelled = String(r.status).toUpperCase() === "CANCELED";
    const displayName = r.userName || accountName || "Request";
    const initials = getInitials(displayName, r.userEmail);

    return (
      <div className={`request-compact ${r.decision_seen === false ? "is-new" : ""} ${cancelled ? "is-cancelled" : ""}`}
           onClick={() => openDetail(r)}>
        {r.decision_seen === false && <NewPill />}
        <div className="request-compact-avatar">{initials}</div>
        <div className="request-compact-body">
          <div className="request-compact-top">
            <span className="request-compact-name">{displayName}</span>
            <Badge status={r.status} />
          </div>
          <div className="request-compact-sub">
            <span className="request-cal"><IconCalendar /></span>
            <span>{formatDate(r.startDate)} — {formatDate(r.endDate)}</span>
            <span className="request-dot" />
            <span>{r.workdaysCount}d</span>
            <span className="request-dot" />
            <span className="request-ellipsis">{String(r.type).replace(/_/g, " ")}</span>
          </div>
        </div>
      </div>
    );
  };

  // ── Table ───────────────────────────────────────────────────
  const TableView = () => (
    <div className="request-tablewrap">
      <div className="request-scroll">
        <table className="request-table">
          <thead>
            <tr>
              <th aria-label="new" />
              <th>Start Date</th>
              <th>End Date</th>
              <th>Duration</th>
              <th>Type</th>
              <th>Comment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}
                  className={`${r.decision_seen === false ? "request-row--new" : ""} ${String(r.status).toUpperCase() === "CANCELED" ? "is-cancelled" : ""}`}
                  onClick={() => openDetail(r)}>
                <td>{r.decision_seen === false ? <span className="request-dot request-dot--pulse" /> : null}</td>
                <td className="request-nowrap"><span className="request-cal"><IconCalendar /></span>{formatDate(r.startDate)}</td>
                <td className="request-nowrap"><span className="request-cal"><IconCalendar /></span>{formatDate(r.endDate)}</td>
                <td><span className="request-days">{r.workdaysCount} <em>days</em></span></td>
                <td className="request-type">{String(r.type).replace(/_/g, " ")}</td>
                <td className="request-ellipsis">{r.comment || "—"}</td>
                <td><Badge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      {view === "cards"   && <div className="request-grid">{rows.map((r) => <Card key={r.id} r={r} />)}</div>}
      {view === "table"   && <TableView />}
      {view === "compact" && <div className="request-list">{rows.map((r) => <CompactRow key={r.id} r={r} />)}</div>}

      <RequestDetailView
        open={!!detail}
        request={detail}
        onClose={() => setDetail(null)}
        actions={
          !detail
            ? []
            : String(detail.status).toUpperCase() === "PENDING"
              ? role === "user"
                ? [{ label: "Cancel", variant: "reject", onClick: () => cancelRequest(detail) }]
                : [
                    { label: "Approve", variant: "approve", onClick: () => decideRequest(detail, "APPROVED") },
                    { label: "Reject",  variant: "reject",  onClick: () => decideRequest(detail, "REJECTED") },
                  ]
              : []
        }
      />
    </>
  );
}
