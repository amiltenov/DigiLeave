import "../styles/account.css";
import { authHeader } from "../auth";
import { useEffect, useState } from "react";

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
    ? [["Assignees", Array.isArray(data.assignees) && data.assignees.length ? data.assignees.join(", ") : "—"]]
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

        <div className="tableWrap">
          <table className="niceTable">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

}
