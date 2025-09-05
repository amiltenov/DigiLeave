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
    for (const u of assignees) m.set(u.id, u);
    return m;
  }, [assignees]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setAssigneesLoading(true);
      setAssigneesErr("");
      try {
        const res = await fetch("https://digileave.onrender.com/approver/assignees", { headers: authHeader() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (alive) setAssignees(Array.isArray(data) ? data : []);
      } catch (e) {
        if (alive) setAssigneesErr("Couldn't load assignees.");
      } finally {
        if (alive) setAssigneesLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

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
      const res = await fetch(`https://digileave.onrender.com/approver/assignee/${assignee.id}/requests`, { headers: authHeader() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setRequestsErr("Couldn't load requests for this user.");
    } finally {
      setRequestsLoading(false);
    }
  }

  async function decide(reqId, status) {
    try {
      const res = await fetch(`https://digileave.onrender.com/approver/request/${reqId}`, {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setRequests(prev => prev.map(r => (r.id === reqId ? updated : r)));
    } catch (e) {
      setRequestsErr("Couldn't update request.");
    }
  }

  const sortedRequests = useMemo(() => {
    const order = { SUBMITTED: 0, APPROVED: 1, REJECTED: 2, CANCELLED: 3 };
    return [...requests].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  }, [requests]);

  return (
    <div className="approver-page">
      <div className="approver-header glass">
        <h1>Approver</h1>
        <div className="approver-actions">
          <button className="accent-btn" onClick={loadAllRequests}>All Requests</button>
        </div>
      </div>

      <section className="approver-section">
        <div className="section-head">
          <h2>Assignees</h2>
        </div>

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
                className="assignee-card glass"
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
        <div className="section-head">
          <h2>
            {selectedAssignee
              ? `Requests — ${selectedAssignee.fullName || selectedAssignee.email}`
              : `Requests — All Assignees`}
          </h2>
          {selectedAssignee && (
            <button
              className="ghost-btn"
              onClick={() => {
                setSelectedAssignee(null);
                setRequests([]);
              }}
            >
              Clear
            </button>
          )}
        </div>

        {requestsErr && <div className="msg glass">{requestsErr}</div>}
        {requestsLoading ? (
          <div className="msg glass">Loading requests…</div>
        ) : sortedRequests.length === 0 ? (
          <div className="msg glass">No requests.</div>
        ) : (
          <div className="request-list">
            {sortedRequests.map(r => {
              const u = userById.get(r.userId);
              const cls = (r.status || "").toLowerCase();
              return (
                <div key={r.id} className={`request-item glass ${cls}`}>
                  <div className="req-top">
                    <div className="req-who">
                      <div className="who-name">{u?.fullName || "—"}</div>
                      <div className="who-email">{u?.email || r.userId}</div>
                    </div>
                    <div className={`status pill ${cls}`}>{r.status}</div>
                  </div>

                  <div className="req-mid">
                    <div className="req-dates">
                      <span>{r.startDate}</span>
                      <span className="dash">→</span>
                      <span>{r.endDate}</span>
                    </div>
                    <div className="req-meta">
                      <span className="badge">{r.type}</span>
                      <span className="badge">{r.workdaysCount ?? 0} days</span>
                    </div>
                  </div>

                  {r.comment && <div className="req-comment">“{r.comment}”</div>}

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
