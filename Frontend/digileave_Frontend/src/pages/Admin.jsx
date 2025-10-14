import { useEffect, useMemo, useState, useId, useCallback } from "react";
import ExportMenu from "../components/ExportMenu";
import { authHeader } from "../utils/auth";
import "../styles/admin.css";

const API = import.meta.env.VITE_API_ORIGIN || "http://localhost:8080";
const ROLES = ["USER", "APPROVER", "ADMIN"];

// normalize assignee field name
const getAssigneeIds = (u) =>
  Array.isArray(u?.assigneeIds) ? u.assigneeIds : Array.isArray(u?.assignees) ? u.assignees : [];

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export default function Admin() {
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);

  // export modal toggle
  const [showExport, setShowExport] = useState(false);

  const rnd = useId();

  // load users
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState("loading");
      try {
        const res = await fetch(`${API}/admin/users`, { headers: authHeader() });
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
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setShowExport(false);
    };
    if (showExport) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showExport]);

  const byId = useMemo(() => new Map(items.map((u) => [u.id, u])), [items]);
  const byEmail = useMemo(() => {
    const m = new Map();
    for (const u of items) if (u.email) m.set(u.email.toLowerCase(), u);
    return m;
  }, [items]);

  const openEdit = (u) => {
    const ids = getAssigneeIds(u);
    const chips = ids.map((id) => {
      const hit = byId.get(id);
      return hit
        ? { id: hit.id, email: hit.email, fullName: hit.fullName || "" }
        : { id, email: id, fullName: "" };
    });

    setEditing(u);
    setErr(null);
    setForm({
      fullName: u.fullName || "",
      email: u.email || "",
      role: u.role || "USER",
      availableLeaveDays: u.availableLeaveDays ?? 0,
      contractLeaveDays: u.contractLeaveDays ?? "",
      workingSince: u.workingSince ?? "",
      assignees: chips, // [{id,email,fullName}]
      assigneeInput: "",
      showSuggest: false,
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(null);
    setErr(null);
  };

  // suggestions for assignees input
  const lastToken = form?.assigneeInput?.trim().toLowerCase() || "";
  const suggestions = useMemo(() => {
    if (!editing || !lastToken) return [];
    const nameMatch = (u) => (u.fullName || "").toLowerCase().includes(lastToken);
    const emailMatch = (u) => (u.email || "").toLowerCase().includes(lastToken);
    const existingIds = new Set((form?.assignees || []).map((a) => a.id));
    return items
      .filter((u) => (emailMatch(u) || nameMatch(u)) && !existingIds.has(u.id))
      .slice(0, 8);
  }, [editing, items, lastToken, form?.assignees]);

  const addChip = useCallback((user) => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      assignees: [ ...(f.assignees || []), { id: user.id, email: user.email, fullName: user.fullName || "" } ],
      assigneeInput: "",
      showSuggest: false,
    }));
  }, []);

  const addAssigneeByEmail = (email) => {
    const user = byEmail.get(email.toLowerCase());
    if (user) addChip(user);
  };

  const addAssigneeFromInput = () => {
    const v = (form?.assigneeInput || "").trim();
    if (!v) return;
    if (v.includes("@")) {
      addAssigneeByEmail(v);
    } else if (suggestions.length > 0) {
      addChip(suggestions[0]);
    }
  };

  const onAssigneeKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAssigneeFromInput();
    }
  };

  const removeAssignee = (id) => {
    setForm((f) => ({ ...f, assignees: (f.assignees || []).filter((a) => a.id !== id) }));
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setErr(null);

    const assigneeIds = (form.assignees || []).map((a) => a.id);

    // include pending typed value
    if (form.assigneeInput) {
      const v = form.assigneeInput.trim();
      if (v.includes("@")) {
        const u = byEmail.get(v.toLowerCase());
        if (u && !assigneeIds.includes(u.id)) assigneeIds.push(u.id);
      } else if (suggestions.length > 0) {
        const u = suggestions[0];
        if (u && !assigneeIds.includes(u.id)) assigneeIds.push(u.id);
      }
    }

    const payload = {
      fullName: form.fullName,
      email: form.email,
      role: form.role,
      availableLeaveDays: Number(form.availableLeaveDays),
      assignees: assigneeIds,
      assigneeIds: assigneeIds,
      contractLeaveDays:
        form.contractLeaveDays === "" || form.contractLeaveDays == null ? null : Number(form.contractLeaveDays),
      workingSince: form.workingSince || null,
    };

    try {
      const res = await fetch(`${API}/admin/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setErr(`Save failed (HTTP ${res.status})`);
        return;
      }
      const saved = await res.json();
      setItems(items.map((x) => (x.id === saved.id ? saved : x)));
      closeEdit();
    } catch {
      setErr("Network error");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (u) => {
    if (!confirm(`Delete ${u.email}?`)) return;
    try {
      const res = await fetch(`${API}/admin/users/${u.id}`, { method: "DELETE", headers: authHeader() });
      if (res.status !== 204 && !res.ok) {
        alert(`Delete failed (HTTP ${res.status})`);
        return;
      }
      setItems(items.filter((x) => x.id !== u.id));
      if (editing?.id === u.id) closeEdit();
    } catch {
      alert("Network error");
    }
  };

  if (state === "loading") return <div className="admin-root centered">Loading…</div>;
  if (state === "unauth") return <div className="admin-root centered">Not authorized.</div>;
  if (state === "error") return <div className="admin-root centered">Could not load users.</div>;

  const chipRows = chunk((form?.assignees || []), 2);

  return (
    <div className="admin-root">
      <div className="admin-inner">
        <div className="admin-header">
          <h1>Users</h1>

          {/* Toggle Export modal */}
          <div className="header-actions" style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => setShowExport(true)}>Export CSV</button>
          </div>
        </div>

        {/* Export modal — single inner window owned by ExportMenu */}
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

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Full name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Leave days</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName || "—"}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.availableLeaveDays}</td>
                  <td className="actions">
                    <button className="btn small" onClick={() => openEdit(u)}>Edit</button>
                    <button className="btn small danger" onClick={() => deleteUser(u)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit user modal — restored exactly like your old version */}
        {editing && (
          <div
            className="admin-modal"
            onClick={(e) => {
              if (e.target.classList.contains("admin-modal")) closeEdit();
            }}
          >
            <div className="admin-modal-card">
              <div className="modal-header">
                <h3>Edit user</h3>
                <button className="icon-btn" onClick={closeEdit} aria-label="Close">✕</button>
              </div>

              {err && <div className="modal-alert err">{err}</div>}

              <form
                className="modal-form"
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEdit();
                }}
              >
                <div className="grid">
                  <label>
                    <span>Full name</span>
                    <input
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      autoComplete="new-password"
                      name={`${rnd}-fn`}
                      spellCheck={false}
                      autoCapitalize="off"
                    />
                  </label>

                  <label>
                    <span>Email</span>
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      autoComplete="new-password"
                      name={`${rnd}-em`}
                      spellCheck={false}
                      autoCapitalize="off"
                      inputMode="email"
                    />
                  </label>

                  <label>
                    <span>Role</span>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="themed-select"
                      id="role-dropdown"
                      name={`${rnd}-role`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Available leave days</span>
                    <input
                      className="themed-select"
                      type="number"
                      min="0"
                      value={form.availableLeaveDays}
                      onChange={(e) => setForm({ ...form, availableLeaveDays: e.target.value })}
                      autoComplete="new-password"
                      name={`${rnd}-days`}
                      spellCheck={false}
                      autoCapitalize="off"
                      inputMode="numeric"
                    />
                  </label>

                  <label>
                    <span>Yearly Contract Leave Days</span>
                    <input
                      className="themed-select"
                      type="number"
                      min="0"
                      value={form.contractLeaveDays ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          contractLeaveDays: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      autoComplete="off"
                      name={`${rnd}-contract-days`}
                      inputMode="numeric"
                    />
                  </label>

                  <label>
                    <span>Working Since</span>
                    <input
                      className="themed-select"
                      type="date"
                      value={form.workingSince ?? ""}
                      onChange={(e) => setForm({ ...form, workingSince: e.target.value })}
                      name={`${rnd}-working-since`}
                    />
                  </label>
                </div>

                {form.role === "APPROVER" ? (
                  <div className="span-2">
                    <span>Assignees</span>
                    <div className="chip-wrap">
                      {chipRows.map((row, i) => (
                        <div
                          className={`chip-row ${row.length === 1 ? "center" : ""}`}
                          key={`row-${i}`}
                          aria-label="assignees-row"
                        >
                          {row.map((a) => (
                            <div className="chip" key={a.id} title={a.email}>
                              <div className="chip-avatar">
                                {(a.fullName || a.email || "?").charAt(0).toUpperCase()}
                              </div>
                              <div className="chip-text">
                                <div className="chip-name">{a.fullName || "—"}</div>
                                <div className="chip-email">{a.email}</div>
                              </div>
                              <button
                                type="button"
                                className="chip-x"
                                onClick={() => removeAssignee(a.id)}
                                aria-label="Remove"
                                title="Remove"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ))}

                      <div className="chip-add">
                        <input
                          value={form.assigneeInput}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, assigneeInput: e.target.value, showSuggest: true }))
                          }
                          onKeyDown={onAssigneeKeyDown}
                          onFocus={() => setForm((f) => ({ ...f, showSuggest: true }))}
                          onBlur={() => setTimeout(() => setForm((f) => ({ ...f, showSuggest: false })), 150)}
                          placeholder="Type name or email and press Enter"
                          name={`${rnd}-asg`}
                          autoComplete="new-password"
                          spellCheck={false}
                          autoCapitalize="off"
                          inputMode="search"
                        />

                        {form?.showSuggest && suggestions.length > 0 && (
                          <div className="suggest-list solid">
                            {suggestions.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                className="suggest-item"
                                onClick={() => addChip(s)}
                                title={s.fullName || s.email}
                                tabIndex={0}
                              >
                                <span className="s-name">{s.fullName || "—"}</span>
                                <span className="s-email">{s.email}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="modal-actions spaced">
                  <button className="btn" disabled={saving} type="submit">
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button className="btn ghost" type="button" onClick={closeEdit}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
