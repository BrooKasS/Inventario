// frontend/src/components/AssetCreateModal.fields.tsx
// ─────────────────────────────────────────────────────────────────────────
// Exporta: C (design tokens), Field, SelectField, AutocompleteField
// ⛔ NO modificar Field — es idéntico al original del monolito
// ─────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";

/* ─── Design tokens ─── */
export const C = {
  grad:    "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)",
  primary: "#B7312C",
  accent:  "#FA8200",
  dark:    "#861F41",
  border:  "#F0E8E8",
  surface: "#FAFAFA",
  text:    "#1A1A1A",
  muted:   "#888",
  success: "#27AE60",
  error:   "#E74C3C",
  warning: "#F39C12",
  info:    "#3498DB",
};

/* ─── Estilos base compartidos ─── */
export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 15px",
  border: `1px solid #e5ddd8`,
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "Calibri, sans-serif",
  color: C.text,
  background: "#fefcfa",
  outline: "none",
  transition: "all 0.2s ease",
  boxSizing: "border-box",
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#4a4a4a",
  marginBottom: 7,
  fontFamily: "Calibri, sans-serif",
};

/* ═══════════════════════════════════════════════════════
   Field — input libre (idéntico al monolito original)
═══════════════════════════════════════════════════════ */
export function Field({
  label, field, value, onChange, type = "text", placeholder, required, readOnly,
}: {
  label: string;
  field: string;
  value: string;
  onChange: (field: string, val: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: C.accent, marginLeft: 3 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder ?? `Ej: ${label.toLowerCase()}...`}
        style={{
          ...inputStyle,
          borderColor: focused ? C.primary : "#e5ddd8",
          boxShadow: focused
            ? `0 0 0 2px rgba(183, 49, 44, 0.08), 0 2px 6px rgba(0,0,0,0.06)`
            : "0 1px 2px rgba(0,0,0,0.03)",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SelectField — opciones fijas (vocabulario controlado)
═══════════════════════════════════════════════════════ */
export function SelectField({
  label, field, value, onChange, options, required,
}: {
  label: string;
  field: string;
  value: string;
  onChange: (field: string, val: string) => void;
  options: string[];
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: C.accent, marginLeft: 3 }}>*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(field, e.target.value)}
        style={{
          ...inputStyle,
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: 32,
          borderColor: focused ? C.primary : "#e5ddd8",
          boxShadow: focused
            ? `0 0 0 2px rgba(183, 49, 44, 0.08), 0 2px 6px rgba(0,0,0,0.06)`
            : "0 1px 2px rgba(0,0,0,0.03)",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <option value="">— Seleccionar —</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   AutocompleteField — lee BD vía /api/assets/suggestions
═══════════════════════════════════════════════════════ */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <strong style={{ color: C.primary }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </span>
  );
}

export function AutocompleteField({
  label, field, value, onChange, tipo, required, placeholder,
}: {
  label: string;
  field: string;
  value: string;
  onChange: (field: string, val: string) => void;
  tipo: "SERVIDOR" | "RED" | "UPS" | "BASE_DATOS" | "MOVIL" | "ASSET";
  required?: boolean;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const [focused, setFocused]         = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = async (q: string) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("inventario_token");
      const url   = `${import.meta.env.VITE_API_URL}/assets/suggestions?tipo=${tipo}&field=${field}&q=${encodeURIComponent(q)}`;
      const res   = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json  = await res.json();
      const data: string[] = json?.data?.suggestions ?? [];
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (val: string) => {
    onChange(field, val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleFocus = () => {
    setFocused(true);
    fetchSuggestions(value);
  };

  const handleSelect = (val: string) => {
    onChange(field, val);
    setSuggestions([]);
    setOpen(false);
  };

  // Cerrar al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: C.accent, marginLeft: 3 }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? `Ej: ${label.toLowerCase()}...`}
          style={{
            ...inputStyle,
            paddingRight: 32,
            borderColor: focused ? C.primary : "#e5ddd8",
            boxShadow: focused
              ? `0 0 0 2px rgba(183, 49, 44, 0.08), 0 2px 6px rgba(0,0,0,0.06)`
              : "0 1px 2px rgba(0,0,0,0.03)",
          }}
        />
        {/* Spinner sutil */}
        {loading && (
          <div style={{
            position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)",
            width: 14, height: 14,
            border: "2px solid #e5ddd8",
            borderTopColor: C.primary,
            borderRadius: "50%",
            animation: "acSpin 0.6s linear infinite",
          }} />
        )}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute",
          zIndex: 999,
          top: "100%",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid #e5ddd8",
          borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          marginTop: 3,
          overflow: "hidden",
        }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => handleSelect(s)}
              style={{
                padding: "10px 14px",
                fontSize: 13,
                fontFamily: "Calibri, sans-serif",
                color: C.text,
                cursor: "pointer",
                borderBottom: i < suggestions.length - 1 ? "1px solid #f5f0ed" : "none",
                background: "#fff",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#fef7f4")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
            >
              <HighlightMatch text={s} query={value} />
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes acSpin{0%{transform:translateY(-50%) rotate(0deg)}100%{transform:translateY(-50%) rotate(360deg)}}`}</style>
    </div>
  );
}