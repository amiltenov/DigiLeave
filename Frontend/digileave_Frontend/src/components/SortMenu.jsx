import { useEffect, useRef, useState } from "react";
import "../styles/sort-menu.css";
import { IconSort } from "../utils/icons";

/**
 * Props
 * - sortBy: "recent" | "start-date" | "pending-first"
 * - sortOrder: "asc" | "desc"
 * - onChange: ({ sortBy, sortOrder }) => void
 */

export default function SortMenu({
  sortBy = "recent",
  sortOrder = "desc",
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [localBy, setLocalBy] = useState(sortBy);
  const [localOrder, setLocalOrder] = useState(sortOrder);

  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => setLocalBy(sortBy), [sortBy]);
  useEffect(() => setLocalOrder(sortOrder), [sortOrder]);

  const OPTIONS = [
    { value: "pending-first", label: "By Pending First" },
    { value: "start-date", label: "By Start Date" },
    { value: "recent", label: "By Recently Created" },
  ];

  function applyChange(nextBy = localBy, nextOrder = localOrder) {
    setLocalBy(nextBy);
    setLocalOrder(nextOrder);
    onChange?.({ sortBy: nextBy, sortOrder: nextOrder });
  }

  function pick(v) {
    applyChange(v, localOrder);
    setOpen(false);
  }

  function toggleOrder() {
    const next = localOrder === "asc" ? "desc" : "asc";
    applyChange(localBy, next);
  }

  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      const t = e.target;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        triggerRef.current &&
        !triggerRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  const currentLabel =
    OPTIONS.find((o) => o.value === localBy)?.label ?? "Sort";

  return (
    <div className="sort-menu" data-open={open ? "1" : "0"}>
      <div className="sort-top">
        <button
          ref={triggerRef}
          type="button"
          className="sort-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <IconSort className="sort-ico" />
          <span>{currentLabel}</span>
        </button>

        {open && (
          <div ref={panelRef} className="sort-panel" role="listbox">
            {OPTIONS.map((o) => {
              const active = o.value === localBy;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`sort-item${active ? " is-active" : ""}`}
                  onClick={() => pick(o.value)}
                >
                  <span className="sort-item-label">{o.label}</span>
                  {active && <span className="sort-check">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="sort-bottom">
        <button
          type="button"
          className="sort-order"
          title={
            localOrder === "asc"
              ? "Ascending (A→Z / 0→9)"
              : "Descending (Z→A / 9→0)"
          }
          onClick={toggleOrder}
        >
          {localOrder === "asc" ? "A→Z / 0→9" : "Z→A / 9→0"}
        </button>
      </div>
    </div>
  );
}
