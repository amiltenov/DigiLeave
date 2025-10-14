// src/components/ExportMenu.jsx
import React, { useEffect, useMemo, useState } from "react";
import { authHeader } from "../utils/auth";
import { csvExport } from "../utils/csvExport";
import "../styles/exportmenu.css";


const API = import.meta.env.VITE_API_ORIGIN || "https://digileave.onrender.com";

const PRESETS = {
  LAST_TO_NOW: "LAST_TO_NOW",
  THIS_MONTH: "THIS_MONTH",
  THIS_YEAR: "THIS_YEAR",
  ALL: "ALL",
};

const REQUEST_FIELDS_DEFAULT = [
  "assigneeName", "assigneeEmail", "startDate", "endDate", "workdaysCount", "status", "type", "comment",
];
const REQUEST_FIELDS_ALL = [
  "requestId", "assigneeId", "assigneeName", "assigneeEmail",
  "startDate", "endDate", "workdaysCount", "status", "type", "comment",
  "decidedBy", "decidedAt",
];

const USER_FIELDS_DEFAULT = ["fullName", "email", "role", "availableLeaveDays"];
const USER_FIELDS_ALL = ["id","fullName","email","role","availableLeaveDays","contractLeaveDays","workingSince","assigneeIds"];

const HEADERS = {
  requestId: "Request ID",
  assigneeId: "Assignee ID",
  assigneeName: "Assignee Name",
  assigneeEmail: "Assignee Email",
  startDate: "Start Date",
  endDate: "End Date",
  workdaysCount: "Workdays",
  status: "Status",
  type: "Type",
  comment: "Comment",
  decidedBy: "Decided By",
  decidedAt: "Decided At (UTC)",
  id: "User ID",
  fullName: "Full Name",
  email: "Email",
  role: "Role",
  availableLeaveDays: "Avail. Leave",
  contractLeaveDays: "Contract Leave",
  workingSince: "Working Since",
  assigneeIds: "Assignee IDs",
};

function todayIso() { return new Date().toISOString().slice(0,10); }
function firstOfMonthIso() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().slice(0,10);
}
function firstOfYearIso() {
  const d = new Date(); d.setMonth(0,1);
  return d.toISOString().slice(0,10);
}
function loadLastExportTo() {
  return localStorage.getItem("digileave:lastExportTo") || null;
}
function saveLastExportTo(dateIso) {
  localStorage.setItem("digileave:lastExportTo", dateIso);
}

function overlaps(req, fromIso, toIso) {
  if (!fromIso && !toIso) return true;
  const s = req.startDate; // yyyy-MM-dd
  const e = req.endDate;
  if (fromIso && e < fromIso) return false; // request ends before window starts
  if (toIso && s > toIso) return false;     // request starts after window ends
  return true;
}

export default function ExportMenu() {
  const [role, setRole] = useState(null); // "ADMIN" | "APPROVER"
  const [dataset, setDataset] = useState("REQUESTS"); // "REQUESTS" | "USERS"
  const [assignees, setAssignees] = useState([]); // approver’s users (or all for admin via approver endpoint)
  const [requests, setRequests] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);

  const [preset, setPreset] = useState(PRESETS.LAST_TO_NOW);
  const [fromDate, setFromDate] = useState(() => loadLastExportTo() || firstOfMonthIso());
  const [toDate, setToDate] = useState(() => todayIso());

  const [requestFields, setRequestFields] = useState(REQUEST_FIELDS_DEFAULT);
  const [userFields, setUserFields] = useState(USER_FIELDS_DEFAULT);

  const [sortBy, setSortBy] = useState("startDate"); // default for requests
  const [sortDir, setSortDir] = useState("asc");

  // 1) load role
  useEffect(() => {
    (async () => {
      const r = await fetch(`${API}/account`, { headers: authHeader() });
      if (!r.ok) return;
      const me = await r.json(); // { role: "ADMIN" | "APPROVER", ... }
      setRole(me.role);
    })();
  }, []);

  // 2) fetch data depending on role/dataset
  useEffect(() => {
    if (!role) return;

    const fetchForRequests = async () => {
      // approver/requests returns ALL requests for approver’s assignees; admin also allowed there per your backend
      const [assigneesRes, requestsRes] = await Promise.all([
        fetch(`${API}/approver/assignees`, { headers: authHeader() }),
        fetch(`${API}/approver/requests`, { headers: authHeader() }),
      ]);
      if (assigneesRes.ok) setAssignees(await assigneesRes.json());
      if (requestsRes.ok) setRequests(await requestsRes.json());
    };

    const fetchForUsers = async () => {
      if (role === "ADMIN") {
        const res = await fetch(`${API}/admin/users`, { headers: authHeader() });
        if (res.ok) setAdminUsers(await res.json());
      } else {
        // approver: users == assignees
        const res = await fetch(`${API}/approver/assignees`, { headers: authHeader() });
        if (res.ok) setAdminUsers(await res.json());
      }
    };

    fetchForRequests();
    fetchForUsers();
  }, [role]);

  // preset → from/to
  useEffect(() => {
    if (preset === PRESETS.LAST_TO_NOW) {
      const last = loadLastExportTo();
      setFromDate(last || firstOfMonthIso());
      setToDate(todayIso());
    } else if (preset === PRESETS.THIS_MONTH) {
      setFromDate(firstOfMonthIso());
      setToDate(todayIso());
    } else if (preset === PRESETS.THIS_YEAR) {
      setFromDate(firstOfYearIso());
      setToDate(todayIso());
    } else if (preset === PRESETS.ALL) {
      setFromDate("");
      setToDate("");
    }
  }, [preset]);

  // build request rows (map userId→name/email, filter by overlap, sort, then project fields at export time)
  const requestRows = useMemo(() => {
    const byId = new Map(assignees.map(u => [u.id, u]));
    const rows = requests
      .filter(r => overlaps(r, fromDate || null, toDate || null))
      .map(r => {
        const u = byId.get(r.userId);
        const decidedByUser = r.decidedByUserId ? byId.get(r.decidedByUserId) : null;
        return {
          requestId: r.id,
          assigneeId: r.userId,
          assigneeName: u?.fullName || r.userId,
          assigneeEmail: u?.email || "",
          startDate: r.startDate,
          endDate: r.endDate,
          workdaysCount: r.workdaysCount,
          status: r.status,
          type: r.type,
          comment: r.comment || "",
          decidedBy: decidedByUser?.fullName || r.decidedByUserId || "",
          decidedAt: r.decidedAt || "",
        };
      });

    // sort
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      if (av === bv) return 0;
      return (av < bv ? -1 : 1) * dir;
    });

    return rows;
  }, [assignees, requests, fromDate, toDate, sortBy, sortDir]);

  // build user rows (admin: all users; approver: assignees only)
  const userRows = useMemo(() => {
    // keep order by fullName asc by default
    const rows = [...adminUsers].sort((a, b) =>
      (a.fullName || "").localeCompare(b.fullName || "")
    ).map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      availableLeaveDays: u.availableLeaveDays,
      contractLeaveDays: u.contractLeaveDays,
      workingSince: u.workingSince,
      assigneeIds: Array.isArray(u.assigneeIds) ? u.assigneeIds : [],
    }));
    return rows;
  }, [adminUsers]);

  const onExport = () => {
    if (dataset === "REQUESTS") {
      // remember last export "to" date
      if (toDate) saveLastExportTo(toDate);
      csvExport(
        requestRows,
        requestFields,
        "requests-export.csv",
        HEADERS
      );
    } else {
      csvExport(
        userRows,
        userFields,
        "users-export.csv",
        HEADERS
      );
    }
  };

  const fieldsForUi = dataset === "REQUESTS" ? REQUEST_FIELDS_ALL : USER_FIELDS_ALL;
  const selectedFields = dataset === "REQUESTS" ? requestFields : userFields;
  const setSelectedFields = dataset === "REQUESTS" ? setRequestFields : setUserFields;

  return (
  <div className="export-card">
    <div className="export-card__head">
      <div className="export-title">Export to CSV</div>
      <div className="export-sub">Configure your export settings and download your data</div>
    </div>

    <div className="export-body">
      {/* Dataset */}
      <section className="export-section">
        <div className="export-section__title">Choose Dataset</div>
        <div className="dataset-row">
          <label
            className={`dataset-card ${dataset === "REQUESTS" ? "dataset-card--active" : ""}`}
            onClick={() => setDataset("REQUESTS")}
          >
            <div className="dataset-card__main">Requests</div>
            <div className="dataset-card__sub">Leave request data</div>
          </label>
          <label
            className={`dataset-card ${dataset === "USERS" ? "dataset-card--active" : ""}`}
            onClick={() => setDataset("USERS")}
          >
            <div className="dataset-card__main">Users</div>
            <div className="dataset-card__sub">User information</div>
          </label>
        </div>
      </section>

      {/* Date Range (requests only) */}
      {dataset === "REQUESTS" && (
        <section className="export-section">
          <div className="export-section__title">Date Range</div>
          <div className="controls-row" style={{ alignItems: "center" }}>
            <select className="select" value={preset} onChange={(e)=>setPreset(e.target.value)}>
              <option value="LAST_TO_NOW">Last Export → Now (Default)</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="THIS_YEAR">This Year</option>
              <option value="ALL">All</option>
            </select>
            <input className="input" type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
            <input className="input" type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
            <div className="meta">Includes any request that overlaps the selected range</div>
          </div>
        </section>
      )}

      {/* Fields */}
      <section className="export-section">
        <div className="export-section__title">Fields to Export</div>
        <div className="small-links" style={{ marginBottom: 8 }}>
          <button onClick={() => setSelectedFields(fieldsForUi)}>Select All</button>
          <button onClick={() => setSelectedFields([])}>Clear All</button>
        </div>
        <div className="chips">
          {fieldsForUi.map((f) => {
            const checked = selectedFields.includes(f);
            return (
              <label key={f} className="chip">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked) setSelectedFields(selectedFields.filter(x => x !== f));
                    else setSelectedFields([...selectedFields, f]);
                  }}
                />
                {HEADERS[f] || f}
              </label>
            );
          })}
        </div>
      </section>

      {/* Sort */}
      <section className="export-section">
        <div className="export-section__title">Sort Data</div>
        <div className="controls-row">
          <select
            className="select"
            value={dataset === "REQUESTS" ? sortBy : "fullName"}
            onChange={(e)=> dataset === "REQUESTS" ? setSortBy(e.target.value) : null}
            disabled={dataset !== "REQUESTS"}
          >
            {(dataset === "REQUESTS" ? REQUEST_FIELDS_ALL : USER_FIELDS_ALL)
              .map(f => <option key={f} value={f}>{HEADERS[f] || f}</option>)}
          </select>
          <select className="select" value={sortDir} onChange={(e)=>setSortDir(e.target.value)}>
            <option value="asc">Ascending (A→Z, 0→9)</option>
            <option value="desc">Descending (Z→A, 9→0)</option>
          </select>
        </div>
      </section>

      {/* Action */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn-primary" onClick={onExport}>Export CSV</button>
        <div className="meta">
          Role: {role || "…"} · Rows: {dataset === "REQUESTS" ? requestRows.length : userRows.length}
        </div>
      </div>
    </div>
  </div>
);

}
