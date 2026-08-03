import { useState, useRef, useEffect, useCallback } from "react";
import { C, labelStyle, inputStyle } from "./constants";

/* ═══════════════════════════════════════════
   FIELD COMPONENT — NO TOCAR
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
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#B7312C";
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(183,49,44,.08)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#ddd";
            e.currentTarget.style.background = "#fafbfc";
            e.currentTarget.style.boxShadow = "none";
          }}
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
   SECTION COMPONENT — NO TOCAR
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
   EXPORT BUTTON COMPONENT — NO TOCAR
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
   FILTRO INPUT COMPONENT — NO TOCAR
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

/* ═══════════════════════════════════════════
   ESTILOS COMPARTIDOS — MODO EDICIÓN
   Idénticos al Field existente para consistencia visual.
═══════════════════════════════════════════ */
const editBaseStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "9px 12px",
  fontSize: 13,
  borderRadius: 10,
  border: "1.5px solid #ddd",
  width: "100%",
  boxSizing: "border-box",
};

const readSpanStyle: React.CSSProperties = {
  fontSize: 13,
  fontFamily: "Calibri, sans-serif",
  lineHeight: 1.5,
};

/* ═══════════════════════════════════════════
   EDIT SELECT FIELD
   Controlled select en edición, span en lectura.

   NORMALIZACIÓN: busca el valor de BD en las opciones
   de forma case-insensitive + sin tildes para resistir
   typos históricos (ej: "PRODUCCION" → "PRODUCCIÓN").
   Si hay match normalizado lo preselecciona Y lo corrige
   en BD al guardar.
   Si no hay ningún match muestra el valor raw como
   opción extra con indicador naranja para que el usuario
   lo corrija conscientemente.
═══════════════════════════════════════════ */

/** Quita tildes y pasa a lowercase para comparación fuzzy */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Busca la opción canónica que mejor coincide con el valor de BD */
function findCanonical(raw: string, options: string[]): string | null {
  if (!raw) return null;
  if (options.includes(raw)) return raw;
  const normalizedRaw = normalize(raw);
  return options.find((o) => normalize(o) === normalizedRaw) ?? null;
}

export function EditSelectField({
  label,
  value,
  field,
  editing,
  onChange,
  options,
}: {
  label: string;
  value: string | null;
  field: string;
  editing: boolean;
  onChange: (field: string, val: string) => void;
  options: string[];
}) {
  const raw = value ?? "";
  const canonical = findCanonical(raw, options);
  const effectiveValue = canonical ?? raw;
  const isUnknown = raw !== "" && canonical === null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={labelStyle}>{label}</span>
      {editing ? (
        <>
          <select
            value={effectiveValue}
            onChange={(e) => onChange(field, e.target.value)}
            style={{
              ...editBaseStyle,
              cursor: "pointer",
              appearance: "auto",
              borderColor: isUnknown ? "#FA8200" : undefined,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#B7312C";
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(183,49,44,.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = isUnknown ? "#FA8200" : "#ddd";
              e.currentTarget.style.background = "#fafbfc";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="">— Seleccionar —</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            {isUnknown && (
              <option value={raw}>⚠️ {raw} (corregir)</option>
            )}
          </select>
          {isUnknown && (
            <span style={{
              fontSize: 11,
              color: "#FA8200",
              fontFamily: "Calibri, sans-serif",
              marginTop: 2,
            }}>
              Valor no reconocido: "{raw}". Selecciona el correcto.
            </span>
          )}
        </>
      ) : (
        <span style={{ ...readSpanStyle, color: effectiveValue ? "#333" : "#999" }}>
          {effectiveValue || "—"}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   EDIT AUTO FIELD
   Autocomplete con sugerencias de BD en edición,
   span en lectura. Entrada libre siempre aceptada.
   Replica la lógica de AutocompleteField del Create
   adaptada al patrón handleChange(section,field,val)
   del módulo AssetDetail.
═══════════════════════════════════════════ */
export function EditAutoField({
  label,
  value,
  field,
  editing,
  onChange,
  tipo,
  placeholder,
}: {
  label: string;
  value: string | null;
  field: string;
  editing: boolean;
  onChange: (field: string, val: string) => void;
  tipo: "SERVIDOR" | "RED" | "UPS" | "BASE_DATOS" | "MOVIL";
  placeholder?: string;
}) {
  const current = value ?? "";
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const fetchSuggestions = useCallback(
    async (q: string) => {
      const token = sessionStorage.getItem("inventario_token");
      if (!token) return;
      setLoading(true);
      try {
        const url = `${import.meta.env.VITE_API_URL}/assets/suggestions?tipo=${tipo}&field=${field}&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        setSuggestions(json?.data?.suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [tipo, field]
  );

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(field, val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  }

  function handleFocus() {
    // Click sin escribir → trae primeros 10 valores existentes
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchSuggestions(current);
  }

  function handleSelect(val: string) {
    onChange(field, val);
    setSuggestions([]);
    setOpen(false);
  }

  // Resalta la parte coincidente en la sugerencia
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

  if (!editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>{label}</span>
        <span style={{ ...readSpanStyle, color: current ? "#333" : "#999" }}>
          {current || "—"}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative" }}
    >
      <span style={labelStyle}>{label}</span>
      <div style={{ position: "relative" }}>
        <input
          value={current}
          onChange={handleInput}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#B7312C";
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(183,49,44,.08)";
            handleFocus();
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#ddd";
            e.currentTarget.style.background = "#fafbfc";
            e.currentTarget.style.boxShadow = "none";
          }}
          placeholder={placeholder}
          style={{
            ...editBaseStyle,
            paddingRight: loading ? 36 : 12,
          }}
        />
        {loading && (
          <div
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              width: 14,
              height: 14,
              border: "2px solid #e5ddd8",
              borderTop: `2px solid ${C.primary}`,
              borderRadius: "50%",
              animation: "detailAutoSpin 0.7s linear infinite",
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes detailAutoSpin {
          0%   { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>

      {open && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 999,
            background: "#fff",
            border: "1.5px solid #e5ddd8",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.10)",
            maxHeight: 220,
            overflowY: "auto",
            marginTop: 2,
          }}
        >
          {suggestions.map((s) => (
            <div
              key={s}
              onMouseDown={() => handleSelect(s)}
              style={{
                padding: "9px 13px",
                fontSize: 13,
                fontFamily: "Calibri, sans-serif",
                color: "#333",
                cursor: "pointer",
                borderBottom: "1px solid #f5f0ee",
                transition: "background .12s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#fef7f4")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#fff")
              }
            >
              <HighlightMatch text={s} query={current} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   DIAS RESTANTES BADGE
   Etiqueta de color segun cuanto falta para una
   fecha (verde > 3 meses, amarillo 2-3, rojo < 2,
   "VENCIDO" si ya paso). Usada en certificados SSL
   y sus aplicaciones hijas.
═══════════════════════════════════════════ */
export function DiasRestantesBadge({ fecha }: { fecha: string | null | undefined }) {
  if (!fecha) return null;
  const ahora = new Date();
  const fin = new Date(fecha);
  if (isNaN(fin.getTime())) return null;
  fin.setHours(23, 59, 59, 999);
  const diffMs = fin.getTime() - ahora.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffMeses = diffDias / 30;

  if (diffDias < 0) {
    return <span style={{ color: "#c0392b", fontWeight: 800, fontSize: 12, background: "#ffebeb", padding: "2px 8px", borderRadius: 10, marginLeft: 8 }}>⚠️ VENCIDO</span>;
  }

  let color = "#27ae60";
  if (diffMeses < 2) color = "#c0392b";
  else if (diffMeses < 3) color = "#f39c12";

  const label = diffDias >= 30
    ? `${Math.floor(diffMeses)} mes${Math.floor(diffMeses) !== 1 ? "es" : ""} ${Math.floor(diffDias % 30)} día${Math.floor(diffDias % 30) !== 1 ? "s" : ""}`
    : `${diffDias} día${diffDias !== 1 ? "s" : ""}`;

  return (
    <span style={{ color, fontWeight: 800, fontSize: 12, background: `${color}15`, padding: "2px 8px", borderRadius: 10, marginLeft: 8, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════
   EDIT DATE FIELD
   Date picker nativo en edición, span en lectura.
   Soluciona la pérdida del date picker que tenía
   Field al recibir type="date" — Field no soporta
   el prop type, por eso se perdía.
═══════════════════════════════════════════ */
export function EditDateField({
  label,
  value,
  field,
  editing,
  onChange,
}: {
  label: string;
  value: string | null;
  field: string;
  editing: boolean;
  onChange: (field: string, val: string) => void;
}) {
  const current = value ?? "";

  // Formatea para lectura: "2024-06-15" → "15/06/2024"
  function formatDisplay(raw: string): string {
    if (!raw) return "—";
    // Si viene en formato ISO con hora, extraer solo la fecha
    const dateOnly = raw.split("T")[0];
    const parts = dateOnly.split("-");
    if (parts.length !== 3) return raw;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // El input type="date" necesita exactamente "YYYY-MM-DD"
  function toInputValue(raw: string): string {
    if (!raw) return "";
    return raw.split("T")[0];
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={labelStyle}>{label}</span>
      {editing ? (
        <input
          type="date"
          value={toInputValue(current)}
          onChange={(e) => onChange(field, e.target.value)}
          style={{
            ...editBaseStyle,
            cursor: "pointer",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#B7312C";
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(183,49,44,.08)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#ddd";
            e.currentTarget.style.background = "#fafbfc";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      ) : (
        <span style={{ ...readSpanStyle, color: current ? "#333" : "#999" }}>
          {formatDisplay(current)}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   URL FIELD
   Input en edición; en lectura, si hay valor lo
   muestra como link clicable (target=_blank) en
   vez de texto plano. Antepone https:// si el
   valor guardado no trae protocolo.
═══════════════════════════════════════════ */
export function UrlField({
  label,
  value,
  field,
  editing,
  onChange,
}: {
  label: string;
  value: string | null;
  field: string;
  editing: boolean;
  onChange: (field: string, val: string) => void;
}) {
  const current = value ?? "";
  const href = /^https?:\/\//i.test(current.trim()) ? current.trim() : `https://${current.trim()}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={labelStyle}>{label}</span>
      {editing ? (
        <input
          defaultValue={current}
          placeholder="https://ejemplo.com"
          onChange={(e) => onChange(field, e.target.value)}
          style={editBaseStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#B7312C";
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(183,49,44,.08)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#ddd";
            e.currentTarget.style.background = "#fafbfc";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      ) : current ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, color: C.primary, fontWeight: 600, textDecoration: "none", fontFamily: "Calibri, sans-serif" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          🔗 {current}
        </a>
      ) : (
        <span style={{ ...readSpanStyle, color: "#999" }}>—</span>
      )}
    </div>
  );
}