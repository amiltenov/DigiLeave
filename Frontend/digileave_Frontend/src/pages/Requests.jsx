import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authHeader } from "../auth";
import "../styles/requests.css";

const API = import.meta.env.VITE_API_ORIGIN || "https://digileave.onrender.com";

function prettyType(t) {
  if (!t) return "—";
  return t
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Requests() {
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      try {
        const res = await fetch(`${API}/requests`, { headers: authHeader() });
        if (res.status === 401) {
          if (!cancelled) setState("unauth");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setItems(data || []);
        if (!cancelled) setState((data && data.length) ? "ready" : "empty");
      } catch (e) {
        console.error("[Requests] load error:", e);
        if (!cancelled) setState("error");
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const fmtDate = (s) => {
    if (!s) return "—";
    try { return new Date(s).toLocaleDateString(); } catch { return s; }
  };

  if (state === "loading") return <div className="requests-root centered">Loading…</div>;
  if (state === "unauth")
    return (
      <div className="requests-root centered">
        <p>Not signed in.</p>
        <a href={`${API}/oauth2/authorization/google`}>Login with Google</a>
      </div>
    );
  if (state === "error") return <div className="requests-root centered">Couldn’t load your requests.</div>;
  if (state === "empty")
    return (
      <div className="requests-root">
        <div className="requests-inner">
          <h1>My Requests</h1>
          <p>You don’t have any requests yet.</p>
          <Link to="/requests/new" className="new-request-btn">Create your first request →</Link>
        </div>
      </div>
    );

  return (
    <div className="requests-root">
      <div className="requests-inner">
        <div className="requests-header">
          <h1>My Requests</h1>
          <Link to="/requests/new" className="new-request-btn">+ New Request</Link>
        </div>

        <div className="requests-table-wrap">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Start</th>
                <th>End</th>
                <th>Workdays</th>
                <th>Leave type</th>
                <th>Comment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>{fmtDate(r.startDate)}</td>
                  <td>{fmtDate(r.endDate)}</td>
                  <td>{r.workdaysCount}</td>
                  <td>{prettyType(r.type)}</td>
                  <td>{r.comment || "—"}</td>
                  <td className="status">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
