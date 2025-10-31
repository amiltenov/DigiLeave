import { useEffect, useMemo, useState } from "react";
import ExportMenu from "../components/ExportMenu";
import RequestsViewMode from "../components/RequestComponents/RequestsViewMode";
import RequestsViewModeMenu from "../components/RequestComponents/RequestsViewModeMenu";
import { authHeader } from "../utils/auth";
import { BASE_API_URL } from "../utils/base_api_url";
import "../styles/approver.css";
import "../styles/admin.css";
import { ExportIcon } from "../utils/icons";

export default function Approver() {
  const [assignees, setAssignees] = useState([]);
  const [assigneesLoading, setAssigneesLoading] = useState(true);
  const [assigneesErr, setAssigneesErr] = useState("");

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsErr, setRequestsErr] = useState("");

  const [selectedAssignee, setSelectedAssignee] = useState(null);

  const [view, setView] = useState("cards");
  const [sortBy, setSortBy] = useState("pending-first");
  const [sortOrder, setSortOrder] = useState("asc");

  const [showExport, setShowExport] = useState(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setShowExport(false); };
    if (showExport) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showExport]);

  const userById = useMemo(() => {
    const m = new Map();
    for (const u of assignees) m.set(u.id, u);
    return m;
  }, [assignees]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setAssigneesLoading(true);
      setAssigneesErr("");
      try {
        const res = await fetch(`${BASE_API_URL}/approver/assignees`, { headers: authHeader() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (alive) setAssignees(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setAssigneesErr("Couldn't load assignees.");
      } finally {
        if (alive) setAssigneesLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    loadAllRequests();
  }, []);

  async function loadAllRequests() {
    setSelectedAssignee(null);
    setRequestsLoading(true);
    setRequestsErr("");
    try {
      const res = await fetch(`${BASE_API_URL}/approver/requests`, { headers: authHeader() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequestsErr("Couldn't load requests.");
    } finally {
      setRequestsLoading(false);
    }
  }

  async function loadAssigneeRequests(assignee) {
    setSelectedAssignee(assignee);
    setRequestsLoading(true);
    setRequestsErr("");
    try {
      const res = await fetch(`${BASE_API_URL}/approver/assignee/${assignee.id}/requests`, { headers: authHeader() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequestsErr("Couldn't load requests for this user.");
    } finally {
      setRequestsLoading(false);
    }
  }

  // decorate with user display info
  const decoratedRequests = useMemo(() => {
    return requests.map((r) => {
      const u = userById.get(r.userId);
      return { ...r, userName: u?.fullName || null, userEmail: u?.email || null };
    });
  }, [requests, userById]);

  const handleAfterAction = (updated) => {
    setRequests((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  };

  return (
    <div className="approver-page">
      <div className="approver-header glass">
        <h1>Approver</h1>
        <div className="approver-actions" style={{ display: "flex", gap: 8 }}>
          <button className="export-btn" onClick={loadAllRequests}>All Requests</button>
          <button className="export-btn" onClick={() => setShowExport(true)}><span>Export</span>
      <ExportIcon /></button>
        </div>
      </div>

      {showExport && (
        <div
          className="admin-modal"
          onClick={(e) => {
            if (e.target.classList.contains("admin-modal")) setShowExport(false);
          }}
        >
          <div className="admin-modal-card" role="dialog" aria-modal="true">
            <ExportMenu onClose={() => setShowExport(false)} />
          </div>
        </div>
      )}

      <section className="approver-section">
        <div className="section-head">
        </div>
          <h2>Assignees</h2>

        {assigneesErr && <div className="msg glass">{assigneesErr}</div>}
        {assigneesLoading ? (
          <div className="msg glass">Loading assignees…</div>
        ) : assignees.length === 0 ? (
          <div className="msg glass">No assignees.</div>
        ) : (
          <div className="assignee-grid">
            {assignees.map(u => (
              <button
                key={u.id}
                className={`assignee-card glass${selectedAssignee && selectedAssignee.id === u.id ? " is-selected" : ""}`}
                onClick={() => loadAssigneeRequests(u)}
                title="View this user's requests"
              >
                <div className="assignee-main">
                  <div className="assignee-name">{u.fullName || "—"}</div>
                  <div className="assignee-email">{u.email}</div>
                </div>
                <div className="assignee-meta">
                  <span className="badge role">{u.role}</span>
                  <span className="badge days">{u.availableLeaveDays ?? 0} days</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="approver-section">
            <h2>
              {selectedAssignee
                ? `Requests — ${selectedAssignee.fullName || selectedAssignee.email}`
                : `Requests — All Assignees`}
            </h2>
        <div className="section-head">
          <div className="section-left">

            <span className="rvmm">
            <RequestsViewModeMenu
              view={view}
              onChangeView={setView}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onChangeSortBy={(v) => setSortBy(v)}
              onChangeSortOrder={(v) => setSortOrder(v)}
            />
            </span>
          </div>

          {selectedAssignee && (
            <button
              className="ghost-btn"
              onClick={() => {
                setSelectedAssignee(null);
                loadAllRequests();
              }}
            >
              Clear
            </button>
          )}
        </div>

        {requestsErr && <div className="msg glass">{requestsErr}</div>}
        {requestsLoading ? (
          <div className="msg glass">Loading requests…</div>
        ) : decoratedRequests.length === 0 ? (
          <div className="msg glass">No requests.</div>
        ) : (
          <RequestsViewMode
            items={decoratedRequests}
            sortBy={sortBy}
            sortOrder={sortOrder}
            view={view}
            role="approver"
            apiOrigin={`${BASE_API_URL}`}
            authHeader={authHeader}
            onAfterAction={handleAfterAction}

            showNewPill={false}
            markSeenOnOpen={false}
            prioritizeUnseen={false}
            showIdentityInTable={true}
          />
        )}
      </section>
    </div>
  );
}
