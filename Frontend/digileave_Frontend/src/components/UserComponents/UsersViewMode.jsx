import React, { useMemo } from "react";
import "../../styles/users-view.css";
import { formatDate } from "../../utils/formatDate";

const Icon = {
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}>
      <g fill="currentColor">
        <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v12A2.5 2.5 0 0 1 19.5 21h-15A2.5 2.5 0 0 1 2 18.5v-12A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1zm12.5 6.5v-2A.5.5 0 0 0 19 6H5a.5.5 0 0 0-.5.5v2H19.5zM5 10h14v8.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V10z"/>
      </g>
    </svg>
  ),
  Mail: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  ),
};

const initials = (fullName, email) => {
  const base = (fullName && fullName.trim()) || email || "";
  const letters = base.match(/\b\p{L}/gu) || base.slice(0, 2).split("");
  return letters.slice(0, 2).join("").toUpperCase();
};

export default function UsersViewMode({
  items = [],
  view = "cards",
  sortBy = "name",         // "name" | "email" | "role"
  sortOrder = "asc",       // "asc" | "desc"
  renderActions,
}) {
  const rows = useMemo(() => {
    const list = Array.isArray(items) ? [...items] : [];
    const dir = sortOrder === "asc" ? 1 : -1;
    const cmp = (a, b) =>
      String(a || "").localeCompare(String(b || ""), undefined, { sensitivity: "base" });

    list.sort((a, b) => {
      switch (sortBy) {
        case "email": return dir * cmp(a.email, b.email);
        case "role":  return dir * cmp(a.role, b.role);
        case "name":
        default:      return dir * cmp(a.fullName || a.email, b.fullName || b.email);
      }
    });
    return list;
  }, [items, sortBy, sortOrder]);

  const roleCls = (role) => `role-badge role-${String(role || "").toLowerCase()}`;

  /* ======= CARDS (unchanged) ======= */
  const Card = ({ u }) => (
    <div className="user-card">
      <header className="user-card-head">
        <div className="user-identity">
          <div className="user-avatar">{initials(u.fullName, u.email)}</div>
          <div className="user-title">
            <div className="user-name">{u.fullName || "—"}</div>
            <div className="user-email"><Icon.Mail /> {u.email}</div>
          </div>
        </div>
        <span className={roleCls(u.role)}>{u.role}</span>
      </header>

      <div className="user-meta">
        <div className="user-meta-row">
          <span className="user-working">
            Working Since {u.workingSince ? formatDate(u.workingSince) : "—"}
          </span>
        </div>
      </div>

      {renderActions && <span className="user-actions-row">{renderActions(u)}</span>}
    </div>
  );

  /* ---- COMPACT ------------------ */
  const CompactRow = ({ u }) => (
    <div className="user-compact">
      {renderActions && (
        <div className="user-compact-actions">
          {renderActions(u)}
        </div>
      )}

      <div className="user-compact-content">
        <div className="user-compact-id">
          <div className="user-compact-text">
            <div className="user-compact-name">{u.fullName || "—"}</div>
            <div className="user-compact-email"><Icon.Mail /> <span>{u.email}</span></div>
          </div>
        </div>

        <div className="user-compact-since">
          <Icon.Calendar /> <span>Since {u.workingSince ? formatDate(u.workingSince) : "—"}</span>
        </div>
      </div>

      <span className={`user-compact-role ${roleCls(u.role)}`}>{u.role}</span>
    </div>
  );

  /* ------ TABLE ------------------- */
  const TableView = () => (
    <div className="user-table-wrap">
      <div className="user-scroll">
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th className="role-col">Role</th>
              <th>Working since</th>
              {renderActions && <th />}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="user-nowrap">
                  <div className="user-table-id">
                    <div className="user-table-avatar">{initials(u.fullName, u.email)}</div>
                    <span>{u.fullName || "—"}</span>
                  </div>
                </td>
                <td className="user-ellipsis">{u.email}</td>
                <td className="role-col"><span className={roleCls(u.role)}>{u.role}</span></td>
                <td>{u.workingSince ? formatDate(u.workingSince) : "—"}</td>
                {renderActions && <td className="user-actions-cell">{renderActions(u)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      {view === "cards" && <div className="user-grid">{rows.map((u) => <Card key={u.id} u={u} />)}</div>}
      {view === "table" && <TableView />}
      {view === "compact" && <div className="user-list">{rows.map((u) => <CompactRow key={u.id} u={u} />)}</div>}
    </>
  );
}
