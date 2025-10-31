import { useEffect, useMemo, useState, useId, useCallback } from "react";
import "../../styles/edit-user-menu.css";
import { authHeader } from "../../utils/auth";

const ROLES = ["USER", "APPROVER", "ADMIN"];

const getAssigneeIds = (u) =>
  Array.isArray(u?.assigneeIds) ? u.assigneeIds : Array.isArray(u?.assignees) ? u.assignees : [];

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export default function EditUsermenu({
  open,
  user,
  users = [],
  apiOrigin,
  onClose,
  onSaved,
}) {
  const rnd = useId();
  const [form, setForm] = useState(null);
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);

  const byId = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const byEmail = useMemo(() => {
    const m = new Map();
    for (const u of users) if (u.email) m.set(u.email.toLowerCase(), u);
    return m;
  }, [users]);

  useEffect(() => {
    if (!open || !user) {
      setForm(null);
      setErr(null);
      setSaving(false);
      return;
    }
    const ids = getAssigneeIds(user);
    const chips = ids.map((id) => {
      const hit = byId.get(id);
      return hit
        ? { id: hit.id, email: hit.email, fullName: hit.fullName || "" }
        : { id, email: id, fullName: "" };
    });

    setForm({
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role || "USER",
      availableLeaveDays: user.availableLeaveDays ?? 0,
      contractLeaveDays: user.contractLeaveDays ?? "",
      workingSince: user.workingSince ?? "",
      assignees: chips,
      assigneeInput: "",
      showSuggest: false,
    });
    setErr(null);
  }, [open, user, byId]);

  const lastToken = form?.assigneeInput?.trim().toLowerCase() || "";
  const suggestions = useMemo(() => {
    if (!open || !user || !lastToken) return [];
    const nameMatch = (u) => (u.fullName || "").toLowerCase().includes(lastToken);
    const emailMatch = (u) => (u.email || "").toLowerCase().includes(lastToken);
    const existingIds = new Set((form?.assignees || []).map((a) => a.id));
    return users
      .filter((u) => (emailMatch(u) || nameMatch(u)) && !existingIds.has(u.id))
      .slice(0, 8);
  }, [open, user, users, lastToken, form?.assignees]);

  const addChip = useCallback((u) => {
    if (!u) return;
    setForm((f) => ({
      ...f,
      assignees: [ ...(f.assignees || []), { id: u.id, email: u.email, fullName: u.fullName || "" } ],
      assigneeInput: "",
      showSuggest: false,
    }));
  }, []);

  const addAssigneeByEmail = (email) => {
    const u = byEmail.get(email.toLowerCase());
    if (u) addChip(u);
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
    if (!user || !form) return;
    setSaving(true);
    setErr(null);

    const assigneeIds = (form.assignees || []).map((a) => a.id);

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
      const res = await fetch(`${apiOrigin}/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setErr(`Save failed (HTTP ${res.status})`);
        return;
      }
      const saved = await res.json();
      onSaved?.(saved);
      onClose?.();
    } catch {
      setErr("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !user || !form) return null;

  const chipRows = chunk((form.assignees || []), 2);

  return (
    <div
      className="admin-menu"
      onClick={(e) => {
        if (e.target.classList.contains("admin-menu")) onClose?.();
      }}
    >
      <div className="admin-menu-card" role="dialog" aria-menu="true">
        <div className="menu-header">
          <h3>Edit user</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {err && <div className="menu-alert err">{err}</div>}

        <form
          className="menu-form"
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
                id="type-dropdown"
                name={`${rnd}-role`}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
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

          <div className="menu-actions spaced">
            <button className="btn" disabled={saving} type="submit">
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="btn ghost" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
