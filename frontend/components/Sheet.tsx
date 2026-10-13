"use client";

export default function Sheet({
  children, onClose, label,
}: { children: React.ReactNode; onClose?: () => void; label?: string }) {
  return (
    <div className="sheet-bg" role="dialog" aria-modal aria-label={label} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="sheet">{children}</div>
    </div>
  );
}
