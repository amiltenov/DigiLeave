import { useMemo } from "react";
export default function CommentClamp({ text = "", previewChars = 10 }) {
  const safe = typeof text === "string" ? text : String(text ?? "");

  const { preview, wasCut } = useMemo(() => {
    const t = safe.trim();
    if (t.length <= previewChars) return { preview: t, wasCut: false };
    const slice = t.slice(0, previewChars).replace(/\s+$/, "");
    return { preview: slice, wasCut: true };
  }, [safe, previewChars]);

  if (!safe) return <>—</>;

  return (
    <span className="comment-clamp">
      <span className="comment-clamp__text">{preview}</span>
      {wasCut && (
        <button
          type="button"
          className="comment-clamp__more"
          title="View full comment"
          aria-label="View full comment"
        >
          …
        </button>
      )}
    </span>
  );
}
