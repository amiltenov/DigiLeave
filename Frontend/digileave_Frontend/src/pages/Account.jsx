import { useEffect, useState } from "react";
import { authHeader } from "../utils/auth";
import { logout } from "../utils/auth";
import { STATE } from "../utils/state";
import { formatDate } from "../utils/formatDate";
import { formatRole } from "../utils/formatRole";
import { BASE_API_URL } from "../utils/base_api_url";
import "../styles/account.css";


export default function Account() {
  const [data, setData] = useState(null);
  const [state, setState] = useState(STATE.LOADING);

  useEffect(() => {
    fetch(`${BASE_API_URL}/account`, { headers: authHeader() })

    .then(res => {
      if (res.status === 401) {
        setState(STATUS.UNAUTH);
        return null;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      return res.json();
    })

    .then(json => {
      if (json) {
        setData(json);
        setState(STATE.READY);
          if (json.role === "APPROVER") {
            fetch(`${BASE_API_URL}/approver/assignees`, { headers: authHeader() })
            .then(r => (r.ok ? r.json() : []))
            .then(list => {
              const emails = Array.isArray(list) ? list.map(u => (u && u.email) ? u.email : u).filter(Boolean) : [];
              setData(prev => ({ ...prev, assigneeEmails: emails }));
            })
            .catch((err) => {
              console.warn("Error fetching assignee emails - resolving with assignee object ids");
            });
          }
      }
    })
    .catch((err) => {
      setState(STATE.ERROR)
      console.warn(`Error: ${err}`);
    })

  }, []);


  
  // STATE MANAGEMENT
  if (state === STATE.LOADING) {
    return <div className="state-msg"><h2>Account</h2><p>Loading…</p></div>;
  }

  if (state === STATE.UNAUTH) {
    return (
      <div className="state-msg">
        <h2>Account</h2>
        <p>You’re not signed in.</p>
        <a className="btn" href={`${BASE_API_URL}/oauth2/authorization/google`}>Login with Google</a>
      </div>
    );
  }

  if (state === STATE.ERROR) {
    return (
      <div className="state-msg">
        <h2>Account</h2>
        <p>Error Loading Account Information!</p>
      </div>
    );
  }


const rows = [
  ["Full Name", data.fullName ?? "—"],
  ["Email", data.email],
  ["Role", formatRole(data.role)],
  ["Available Leave Days", data.availableLeaveDays],
  ["Yearly Leave Days by Contract", data.contractLeaveDays],
  ["Working since", formatDate(data.workingSince)],
  ...(data.role === "APPROVER"
    ? [[
        "Assignees",
        (() => {
          const emails = Array.isArray(data.assigneeEmails) ? data.assigneeEmails.filter(Boolean) : [];
          if (emails.length) return emails.join(", ");
          const ids = Array.isArray(data.assigneeIds) ? data.assigneeIds.filter(Boolean) : [];
          if (ids.length) return ids.join(", ");
          return "—";
        })()
      ]]
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
            <div className="account-fullname">{data.fullName}</div>
            <div className="account-email">{data.email}</div>
          </div>
        </div>

        
        <div className="user-data" role="list">
            {rows.map(([k, v]) => (
              <div className="user-data-row" key={k} role="listitem">
                <div className="user-data-label">{k}</div>
                <div className="user-data-value">{String(v)}</div>
              </div>
            ))}
        </div>

        <button className="logout-btn" onClick={() => { logout(); window.location.href = "/"; }}>
            Logout
        </button>
      </div>
    </div>
  </div>
);

}