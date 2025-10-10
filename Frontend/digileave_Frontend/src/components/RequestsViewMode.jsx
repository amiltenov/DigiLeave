import React, { useMemo, useState } from "react";
import "../styles/requests-view.css";
import RequestDetailView from "./RequestDetailView";
import { formatDate } from "../utils/formatDate";
import { BASE_API_URL } from "../utils/base_api_url";

const toTitle = (s) =>
  (s || "").toString().replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
const safeNum = (v, fb = 0) => (typeof v === "number" && !Number.isNaN(v) ? v : fb);
const statusTone = (status) => String(status || "").toLowerCase();
const isSubmitted = (s) =>
  String(s || "").toUpperCase() === "SUBMITTED" || String(s || "").toLowerCase() === "submitted";

const Icon = {
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}>
      <path
        fill="currentColor"
        d="M7 2h2v2h6V2h2v2h3a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h3V2zm14 8H3v10h18V10zM3 8h18V6H3v2z"
      />
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
  // Track "NEW" items that were opened in this session so the pill disappears immediately.
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
            status: (r.status || "").toLowerCase(),
            // NEW: hide pill if we've locally marked it as seen
            isUnseen: r.decision_seen === false && !locallySeen.has(r.id),
            submittedAt:
              r.submittedAt ?? r.createdAt ?? r.created_at ?? r.startDate ?? r.start_date,
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
      const pri = { submitted: 0, approved: 1, denied: 2, rejected: 2, cancelled: 3 };
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

  // ---- endpoints ----
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

  // ---- actions ----
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

  async function decideRequest(row, action /* "APPROVED" | "REJECTED" */) {
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

  // NEW: mark unseen request as seen when opening
  async function markDecisionSeen(row) {
    try {
      // optimistic: hide pill immediately
      setLocallySeen((prev) => {
        const next = new Set(prev);
        next.add(row.id);
        return next;
      });

      const res = await fetch(urlMarkSeen(row.id), {
        method: "PATCH",
        headers: { ...(authHeader?.() || {}) },
      });

      // backend might return the updated entity; if so, push it up
      if (res.ok) {
        let updated;
        try {
          updated = await res.json();
        } catch {
          updated = { ...row, decision_seen: true };
        }
        // ensure our parent list clears NEW too
        onAfterAction?.({ ...row, ...updated, decision_seen: true });
        // if the modal is already open for this id, sync it
        setDetail((d) => (d?.id === row.id ? { ...d, decision_seen: true } : d));
      }
    } catch (e) {
      console.error(e);
      // if it failed, we could revert locallySeen—but leaving it is fine UX-wise.
    }
  }

  // central open handler: mark seen (if needed) + open detail + notify parent select
  function handleOpen(row) {
    if (row?.isUnseen) markDecisionSeen(row);
    setDetail(row);
    onSelectRow?.(row);
  }

  const Badge = ({ status, children }) => {
    const tone = statusTone(status);
    return <span className={`rq-badge rq-badge--${tone}`}>{children ?? toTitle(status)}</span>;
  };
  const NewPill = () => (
    <span className="rq-new-pill">
      <Icon.Eye />
      NEW
    </span>
  );

  const InlineActions = ({ r }) => {
    const decided = !isSubmitted(r.status);
    if (role === "user") {
      return decided ? null : (
        <div className="rv-inline-actions">
          <button
            className="rv-btn rv-btn--cancel"
            onClick={(e) => {
              e.stopPropagation();
              cancelRequest(r);
            }}
          >
            Cancel
          </button>
        </div>
      );
    }
    return decided ? null : (
      <div className="rv-inline-actions">
        <button
          className="rv-btn rv-btn--approve"
          onClick={(e) => {
            e.stopPropagation();
            decideRequest(r, "APPROVED");
          }}
        >
          Approve
        </button>
        <button
          className="rv-btn rv-btn--reject"
          onClick={(e) => {
            e.stopPropagation();
            decideRequest(r, "REJECTED");
          }}
        >
          Reject
        </button>
      </div>
    );
  };

  const Card = ({ r }) => (
    <div className="rq-card rv-clickable" onClick={() => handleOpen(r)}>
      {r.isUnseen && <NewPill />}
      <div className="rq-card__head">
        <div className="rq-avatar" aria-hidden="true">
          {((r.userName || "").match(/\b\w/g) || ["U", "S"]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div className="rq-card__title">
          <div className="rq-card__name">{r.userName || "Request"}</div>
          {r.userEmail && <div className="rq-card__email">{r.userEmail}</div>}
          <Badge status={r.status} />
        </div>
      </div>
      <div className="rq-card__row">
        <span className="rq-card__dates">
          {formatDate(r.startDate)} → {formatDate(r.endDate)}
        </span>
      </div>
      <div className="rq-card__meta">
        <span className="rq-card__type">{r.leaveType}</span>
        <span className="rq-card__days">
          <strong>{safeNum(r.workdays)}</strong> days
        </span>
      </div>
      {r.comment && <div className="rq-card__comment">“{r.comment}”</div>}
      <InlineActions r={r} />
    </div>
  );

  const CompactRow = ({ r }) => (
    <div
      className={`rq-compact rv-clickable ${r.isUnseen ? "rq-compact--new" : ""}`}
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
          <span>
            {formatDate(r.startDate)} — {formatDate(r.endDate)}
          </span>
          <span className="rq-dot" />
          <span>{safeNum(r.workdays)}d</span>
          <span className="rq-dot" />
          <span className="rq-ellipsis">{r.leaveType}</span>
        </div>
        <InlineActions r={r} />
      </div>
    </div>
  );

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
              <th scope="col">Status / Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className={r.isUnseen ? "rq-row--new" : ""}
                onClick={() => handleOpen(r)}
              >
                <td>{r.isUnseen ? <span className="rq-dot rq-dot--pulse" /> : null}</td>
                <td className="rq-nowrap">{formatDate(r.startDate)}</td>
                <td className="rq-nowrap">{formatDate(r.endDate)}</td>
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
                      <Badge status={r.status} />
                    </span>
                    {!isSubmitted(r.status) ? null : (
                      <div className="rv-inline-actions--table" onClick={(e) => e.stopPropagation()}>
                        {role === "user" ? (
                          <button className="rv-btn rv-btn--cancel" onClick={() => cancelRequest(r)}>
                            Cancel
                          </button>
                        ) : (
                          <>
                            <button
                              className="rv-btn rv-btn--approve"
                              onClick={() => decideRequest(r, "APPROVED")}
                            >
                              Approve
                            </button>
                            <button
                              className="rv-btn rv-btn--reject"
                              onClick={() => decideRequest(r, "REJECTED")}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
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
                  {
                    label: "Approve",
                    variant: "approve",
                    onClick: () => decideRequest(detail, "APPROVED"),
                  },
                  {
                    label: "Reject",
                    variant: "reject",
                    onClick: () => decideRequest(detail, "REJECTED"),
                  },
                ]
            : []
        }
      />
    </>
  );
}
