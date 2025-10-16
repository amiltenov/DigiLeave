// src/pages/Admin.jsx
import { useEffect, useState } from "react";
import UsersViewMode from "../components/UsersViewMode";
import UsersViewModeMenu from "../components/UsersViewModeMenu"; // view-only toggle
import EditUserMenu from "../components/EditUserMenu";
import ExportMenu from "../components/ExportMenu";
import { authHeader } from "../utils/auth";
import { BASE_API_URL } from "../utils/base_api_url";
import { ExportIcon, IconSearch } from "../utils/icons"; 
import "../styles/admin.css";

export default function Admin() {
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading");   // loading | ready | unauth | error
  const [view, setView] = useState("cards");       // "cards" | "table" | "compact"

  // A→Z sorting (by name). Click to flip to Z→A.
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" | "desc"

  const [editing, setEditing] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const [fakeQuery, setFakeQuery] = useState("");

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

  if (state === "loading") return <div className="admin-root centered">Loading…</div>;
  if (state === "unauth")  return <div className="admin-root centered">Not authorized.</div>;
  if (state === "error")   return <div className="admin-root centered">Could not load users.</div>;

  return (
    <div className="admin-root">
      <div className="admin-inner">

        {/* HEADER */}
        <div className="admin-header">
          {/* Top row: Users (left) · Export (right) */}
          <div className="header-top">
            <h1>Users</h1>
            <button className="btn export-btn" onClick={() => setShowExport(true)}>
              <span className="export-btn-text">Export</span>
              <ExportIcon />
            </button>
          </div>

          {/* Sub row: search (left) · View Mode (right) */}
          <div
            className="header-sub"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem"
            }}
          >
            {/* search bar*/}
            <div
              className="searchbar"
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".5rem",
                border: "1px solid var(--color-surface-border)",
                background: "var(--color-surface)",
                padding: ".4rem .6rem",
                borderRadius: "6px",
                maxWidth: "360px",
                width: "100%",
                boxShadow: "0 2px 6px var(--color-surface-shadow, transparent)"
              }}
            >
              <img
                src={IconSearch}
                alt=""
                aria-hidden="true"
                width="16"
                height="16"
                style={{ display: "block", opacity: 0.85 }}
              />
              <input
                type="search"
                placeholder="Search users…"
                aria-label="Search users"
                value={fakeQuery}
                onChange={(e) => setFakeQuery(e.target.value)}
                style={{
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  color: "var(--color-text)",
                  width: "100%"
                }}
              />
            </div>

            <UsersViewModeMenu view={view} onChangeView={setView} />
          </div>
        </div>

        {/* CONTENT */}
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

        {/* Export dialog */}
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

        {/* Edit user drawer/menu */}
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
