import { useEffect, useState } from "react";
import UsersViewMode from "../components/UserComponents/UsersViewMode";
import UsersViewModeMenu from "../components/UserComponents/UsersViewModeMenu";
import EditUserMenu from "../components/UserComponents/EditUserMenu";
import ExportMenu from "../components/ExportMenu";
import { authHeader } from "../utils/auth";
import { BASE_API_URL } from "../utils/base_api_url";
import { ExportIcon, IconSearch } from "../utils/icons"; 
import "../styles/admin.css";

export default function Admin() {
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading");   // loading | ready | unauth | error // TODO implement utils/state.js
  const [view, setView] = useState("cards");       // "cards" | "table" | "compact"

  const [sortOrder, setSortOrder] = useState("asc");

  const [editing, setEditing] = useState(null);
  const [showExport, setShowExport] = useState(false);



  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState("loading");
      try {
        const res = await fetch(`${BASE_API_URL}/admin/users`, {
          headers: authHeader(),
        });
        if (!res.ok) {
          setState(res.status === 401 || res.status === 403 ? "unauth" : "error");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
          setState("ready");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => { cancelled = true; };
  }, []);


  const deleteUser = async (u) => {
    if (!confirm(`Delete ${u.email}?`)) return;
    try {
      const res = await fetch(`${BASE_API_URL}/admin/users/${u.id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if (res.status !== 204 && !res.ok) {
        alert(`Delete failed (HTTP ${res.status})`);
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== u.id));
      if (editing?.id === u.id) setEditing(null);
    } catch {
      alert("Network error");
    }
  };

  // TODO implement utils/state.js
  if (state === "loading") return <div className="admin-root centered">Loading…</div>;
  if (state === "unauth")  return <div className="admin-root centered">Not authorized.</div>;
  if (state === "error")   return <div className="admin-root centered">Could not load users.</div>;

  return (
    <div className="admin-root">
      <div className="admin-inner">

        <div className="admin-header">
          <div className="header-top">
            <h1>Users</h1>
            <button className="btn export-btn" onClick={() => setShowExport(true)}>
              <span className="export-btn-text">Export</span>
              <ExportIcon />
            </button>
          </div>

          <div
            className="header-sub"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem"
            }}
          >
            <UsersViewModeMenu view={view} onChangeView={setView} />
          </div>
        </div>

        <UsersViewMode
          items={items}
          view={view}
          sortBy="name"
          sortOrder={sortOrder}
          renderActions={(u) => (
            <>
              <button className="btn small" onClick={() => setEditing(u)}>Edit</button>
              <button className="btn small danger" onClick={() => deleteUser(u)}>Delete</button>
            </>
          )}
        />

        {showExport && (
          <div
            className="admin-modal"
            onClick={(e) => e.target.classList.contains("admin-modal") && setShowExport(false)}
          >
            <div className="admin-modal-card" role="dialog" aria-modal="true">
              <ExportMenu onClose={() => setShowExport(false)} />
            </div>
          </div>
        )}

        <EditUserMenu
          open={!!editing}
          user={editing}
          users={items}
          apiOrigin={BASE_API_URL}
          onClose={() => setEditing(null)}
          onSaved={(saved) => setItems((prev) => prev.map((x) => (x.id === saved.id ? saved : x)))}
        />
      </div>
    </div>
  );
}
