import React from "react";
import "../styles/sort-menu.css";

const Icon = {
  Sort: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M3 7h14v2H3V7zm0 4h10v2H3v-2zm0 4h6v2H3v-2zM18 5l3 3h-2v8h-2V8h-2l3-3z"/>
    </svg>
  ),
  AZ: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M5 17h6v2H3v-1l6-8H3V8h8v1L5 17zm10-7h6v2h-3l3 5v1h-8v-2h5l-3-5v-1z"/>
    </svg>
  ),
  ZA: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M5 7h6V5H3v1l6 8H3v2h8v-1L5 7zm11 10h5v2h-8v-1l3-5h-3v-2h8v1l-3 5z"/>
    </svg>
  ),
};

export default function SortControl({
  sortKey,
  sortOrder = "desc",          // 'asc' | 'desc'
  onChange,                    // (next:{key, order}) => void
  options = [
    { value: "recent", label: "Most Recent" },
    { value: "pending-first", label: "Pending First" },
    { value: "status", label: "By Status" },
  ],
  size = "md",                 // 'sm' | 'md'
  label = "Sort",
}) {
  const toggleOrder = () =>
    onChange?.({ key: sortKey, order: sortOrder === "asc" ? "desc" : "asc" });

  return (
    <div className={`sc bar sc--${size}`}>
      <div className="sc left">
        <Icon.Sort className="sc ico" />
        <div className="sc select">
          <select
            aria-label={label}
            value={sortKey}
            onChange={(e) => onChange?.({ key: e.target.value, order: sortOrder })}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        className="sc orderbtn"
        onClick={toggleOrder}
        type="button"
        aria-label={sortOrder === "asc" ? "Ascending" : "Descending"}
        title={sortOrder === "asc" ? "Ascending" : "Descending"}
      >
        {sortOrder === "asc" ? <Icon.AZ /> : <Icon.ZA />}
        <span className="sc ordertxt">{sortOrder === "asc" ? "A→Z / 0→9" : "Z→A / 9→0"}</span>
      </button>
    </div>
  );
}
