import React from "react";
import SortMenu from "./SortMenu";
import "../styles/view-menu.css";

const Icon = {
  Grid: (p) => <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}><path fill="currentColor" d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/></svg>,
  Table: (p) => <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}><path fill="currentColor" d="M3 3h18v18H3zm2 2v4h14V5zm0 6v8h14v-8zM7 13h3v6H7zm5 0h3v6h-3z"/></svg>,
  List: (p) => <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}><path fill="currentColor" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>,
  ArrowUpDown: (p) => <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}><path fill="currentColor" d="M7 3l4 4H8v10h3l-4 4-4-4h3V7H3l4-4zm10 18l-4-4h3V7h-3l4-4 4 4h-3v10h3l-4 4z"/></svg>,
};

export default function RequestsViewModeMenu({
  view, onChangeView,
  sortBy, sortOrder = "desc",
  onChangeSortBy, onChangeSortOrder,
  sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "pending-first", label: "Pending First" },
    { value: "status", label: "By Status" },
  ]
}) {
  return (
    <div className="vm bar">
      <SortMenu
        sortKey={sortBy}
        sortOrder={sortOrder}
        options={sortOptions}
        onChange={({ key, order }) => {
          onChangeSortBy?.(key);
          onChangeSortOrder?.(order);
        }}
      />

      <div className="vm toggle">
        <button
          className={`vm btn ${view === "cards" ? "is-active" : ""}`}
          onClick={() => onChangeView?.("cards")}
        >
          <Icon.Grid /><span className="vm hide-sm">Cards</span>
        </button>
        <button
          className={`vm btn ${view === "table" ? "is-active" : ""}`}
          onClick={() => onChangeView?.("table")}
        >
          <Icon.Table /><span className="vm hide-sm">Table</span>
        </button>
        <button
          className={`vm btn ${view === "compact" ? "is-active" : ""}`}
          onClick={() => onChangeView?.("compact")}
        >
          <Icon.List /><span className="vm hide-sm">Compact</span>
        </button>
      </div>
    </div>
  );
}
