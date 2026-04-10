import { useState } from "react";
import { C, labelStyle } from "./constants";

/* ═══════════════════════════════════════════
   FIELD COMPONENT
═══════════════════════════════════════════ */
export function Field({
  label,
  value,
  editing,
  field,
  onChange,
}: {
  label: string;
  value: string | number | null;
  editing: boolean;
  field: string;
  onChange: (field: string, val: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={labelStyle}>{label}</span>
      {editing ? (
        <input
          defaultValue={value?.toString() ?? ""}
          onChange={(e) => onChange(field, e.target.value)}
          style={{
            background: "#fafbfc",
            border: "1.5px solid #ddd",
            borderRadius: 10,
            padding: "9px 12px",
            fontSize: 13,
            color: "#333",
            fontFamily: "Calibri, sans-serif",
            outline: "none",
            transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#B7312C"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(183,49,44,.08)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#ddd"; e.currentTarget.style.background = "#fafbfc"; e.currentTarget.style.boxShadow = "none"; }}
        />
      ) : (
        <span
          style={{
            fontSize: 13,
            color: value ? "#333" : "#999",
            fontFamily: "Calibri, sans-serif",
            lineHeight: 1.5,
          }}
        >
          {value ?? "—"}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION COMPONENT
═══════════════════════════════════════════ */
export function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1.5px solid #f0e8e8",
        boxShadow: "0 4px 16px rgba(183,49,44,.06)",
        marginBottom: 18,
      }}
    >
      <div
        style={{
          background: C.grad,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#fff",
          }}
        >
          {title}
        </span>
      </div>
      <div
        style={{
          padding: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px 24px",
          background: "#fff",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   EXPORT BUTTON COMPONENT
═══════════════════════════════════════════ */
export function ExportBtn({
  label,
  emoji,
  onClick,
  disabled,
}: {
  label: string;
  emoji: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        borderRadius: 8,
        border: "1.5px solid rgba(255,255,255,.4)",
        background:
          hov && !disabled
            ? "rgba(255,255,255,.25)"
            : "rgba(255,255,255,.12)",
        color: disabled ? "rgba(255,255,255,.3)" : "#fff",
        fontWeight: 700,
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Calibri, sans-serif",
        transition: "all .18s",
        opacity: disabled ? 0.5 : 1,
        letterSpacing: "0.03em",
      }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════
   FILTRO INPUT COMPONENT
═══════════════════════════════════════════ */
export function FiltroInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: "7px 12px",
        border: "1.5px solid #e8d8d8",
        borderRadius: 8,
        fontSize: 13,
        fontFamily: "Calibri, sans-serif",
        outline: "none",
        background: "#fff",
        color: "#333",
        transition: "border-color .2s",
        minWidth: 0,
        width: "100%",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#e8d8d8")}
    />
  );
}
