import "../styles/account.css";
import { authHeader } from "../auth";
import { useEffect, useState } from "react";
import { logout } from "../auth";


export default function Account() {
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");

    useEffect(() => {
    fetch("https://digileave.onrender.com/account", { headers: authHeader() })
      .then(res => {
        if (res.status === 401) {
          setState("unauth");
          return null;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (json) {
          setData(json);
          setState("ready");
        }
      })
      .catch(() => setState("error"));
  }, []);

  if (state === "loading") {
    return <div className="account-wrap"><h2>Account</h2><p>Loading…</p></div>;
  }

  if (state === "unauth") {
    return (
      <div className="account-wrap">
        <h2>Account</h2>
        <p>You’re not signed in.</p>
        <a className="btn" href="https://digileave.onrender.com/oauth2/authorization/google">Login with Google</a>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="account-wrap">
        <h2>Account</h2>
        <p>Couldn’t load your account. Make sure the backend is running on <code>localhost:8080</code> and CORS allows your origin.</p>
      </div>
    );
  }


const rows = [
  ["Full Name", data.fullName ?? "—"],
  ["Email", data.email],
  ["Role", data.role],
  ["Available Leave Days", data.availableLeaveDays],
  ...(data.role === "APPROVER"
    ? [["Assignees", Array.isArray(data.assigneeIds) && data.assigneeIds.length ? data.assigneeIds.join(", ") : "—"]]
    : []
  ),
];


return (
  <div className="account-root">
    <div className="account-wrap">
      <h2>Account</h2>

      <div className="account-card">
        <div className="account-header">
          <div className="avatar">{(data.email ?? "?").slice(0,2).toUpperCase()}</div>
          <div>
            <div className="account-email">{data.email}</div>
            <div className="account-role">Role: {data.role}</div>
          </div>
        </div>

        {/* Replaced table with a clean stacked list */}
        <div className="infoList" role="list">
          {rows.map(([k, v]) => (
            <div className="infoRow" key={k} role="listitem">
              <div className="label">{k}</div>
              <div className="value">{String(v)}</div>
            </div>
          ))}
        </div>

        <button className="Logout-btn" onClick={() => { logout(); window.location.href = "/"; }}>
            Logout
        </button>
      </div>
    </div>
  </div>
);

}