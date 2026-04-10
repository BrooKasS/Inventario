// src/components/Modal.tsx

export default function Modal({
  open,
  onClose,
  title,
  width = 900,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        animation: "fadeIn .3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: "28px 32px",
          width,
          maxHeight: "88vh",
          overflowY: "auto",
          animation: "slideUp .35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 25px 60px rgba(0,0,0,.25), 0 0 1px rgba(0,0,0,.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.01em" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 24,
              cursor: "pointer",
              color: "#999",
              transition: "all .2s",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#333"; e.currentTarget.style.background = "#f5f5f5"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#999"; e.currentTarget.style.background = "transparent"; }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}