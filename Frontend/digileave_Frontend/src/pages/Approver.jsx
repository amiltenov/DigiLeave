import { useEffect, useMemo, useState } from "react";
import { authHeader } from "../auth";
import "../styles/approver.css";

export default function Approver() {
  const [assignees, setAssignees] = useState([]);
  const [assigneesLoading, setAssigneesLoading] = useState(true);
  const [assigneesErr, setAssigneesErr] = useState("");

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsErr, setRequestsErr] = useState("");

  const [selectedAssignee, setSelectedAssignee] = useState(null);

  const userById = useMemo(() => {
    const m = new Map();
    for (const a of assignees) m.set(a.id, a);
    return m;
  }, [assignees]);

  useEffect(() => {
    loadAssignees();
  }, []);

  useEffect(() => {
    loadAllRequests();
  }, []);

  async function loadAssignees() {
    setAssigneesLoading(true);
    setAssigneesErr("");
    try {
      const res = await fetch("https://digileave.onrender.com/approver/assignees", { headers: authHeader() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAssignees(Array.isArray(data) ? data : []);
    } catch (e) {
      setAssigneesErr("Couldn't load assignees.");
    } finally {
      setAssigneesLoading(false);
    }
  }

  async function loadAllRequests() {
    setSelectedAssignee(null);
    setRequestsLoading(true);
    setRequestsErr("");
    try {
      const res = await fetch("https://digileave.onrender.com/approver/requests", { headers: authHeader() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
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
      const res = await fetch(`https://digileave.onrender.com/approver/assignees/${assignee.id}/requests`, { headers: authHeader() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setRequestsErr("Couldn't load requests.");
    } finally {
      setRequestsLoading(false);
    }
  }

  async function decide(reqId, status) {
    try {
      const res = await fetch(`https://digileave.onrender.com/approver/requests/${reqId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    } catch {}
  }

  return (
    <div className="approver-page">
      <header className="approver-header glass">
        <h1>Approver</h1>
      </header>

      <section className="assignees-section">
        <div className="section-head">
          <h2>Assignees</h2>
          <div className="head-actions">
            <button className="accent-btn" onClick={loadAllRequests}>All Requests</button>
          </div>
        </div>

        {assigneesLoading && <div className="muted">Loading assignees…</div>}
        {!!assigneesErr && <div className="error">{assigneesErr}</div>}

        {!assigneesLoading && !assigneesErr && (
          <div className="assignee-grid">
            {assignees.map(a => (
              <button
                key={a.id}
                className={`assignee-card glass ${selectedAssignee && selectedAssignee.id === a.id ? "is-selected" : ""}`}
                onClick={() => loadAssigneeRequests(a)}
                title={a.email}
              >
                <div className="assignee-top">
                  <div className="assignee-avatar">{(a.email || "?").slice(0, 2).toUpperCase()}</div>
                  <div className="assignee-meta">
                    <div className="assignee-name">{a.fullName || a.email}</div>
                    <div className="assignee-email">{a.email}</div>
                  </div>
                </div>
                <div className="assignee-badges">
                  <span className="badge role">{a.role || "USER"}</span>
                  <span className="badge days">{(a.availableLeaveDays ?? 0)} days</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="requests-section">
        <div className="section-head">
          <h2>
            {selectedAssignee
              ? `Requests — ${selectedAssignee.fullName || selectedAssignee.email}`
              : `Requests — All Assignees`}
          </h2>
          <div className="head-actions">
            <button className="accent-btn" onClick={loadAllRequests}>All Requests</button>
            {selectedAssignee && (
              <button className="ghost-btn" onClick={() => { setSelectedAssignee(null); setRequests([]); }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {requestsLoading && <div className="muted">Loading requests…</div>}
        {!!requestsErr && <div className="error">{requestsErr}</div>}

        {!requestsLoading && !requestsErr && (
          <div className="request-list">
            {requests.map(r => {
              const who = userById.get(r.userId);
              const borderClass =
                r.status === "SUBMITTED" ? "b-submitted" :
                r.status === "APPROVED"  ? "b-approved"  :
                r.status === "REJECTED"  ? "b-rejected"  : "b-default";

              return (
                <div key={r.id} className={`request-item glass ${borderClass}`}>
                  <div className="req-top">
                    <div className="req-person">
                      <div className="avatar">{((who?.email) || "?").slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div className="name">{who?.fullName || who?.email || r.userEmail || "Unknown"}</div>
                        <div className="email">{who?.email || r.userEmail || ""}</div>
                      </div>
                    </div>
                    <div className="req-status">
                      <span className={`pill ${borderClass}`}>{r.status}</span>
                    </div>
                  </div>

                  <div className="req-mid">
                    <div className="req-meta">
                      <span className="chip">{r.leaveType}</span>
                      <span className="chip">{r.days} days</span>
                    </div>
                    <div className="req-when">
                      <span>{r.startDate}</span>
                      <span className="arrow">→</span>
                      <span>{r.endDate}</span>
                    </div>
                  </div>

                  {!!r.comment && <div className="req-comment">“{r.comment}”</div>}

                  {r.status === "SUBMITTED" && (
                    <div className="req-actions">
                      <button className="btn-approve" onClick={() => decide(r.id, "APPROVED")}>Approve</button>
                      <button className="btn-reject" onClick={() => decide(r.id, "REJECTED")}>Reject</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
