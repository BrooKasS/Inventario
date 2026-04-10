import { useState } from "react";
import type { Asset } from "../../../types";
import { TIPO_LABEL } from "../constants";

interface RecentRowProps {
  a: Asset;
  onClick: () => void;
}

export default function RecentRow({ a, onClick }: RecentRowProps) {
  const [hov, setHov] = useState(false);

  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        cursor: "pointer",
        background: hov ? "rgba(250, 129, 0, 0.15)" : "transparent",
        transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)",
        borderBottom: "1px solid rgba(255,255,255,.08)",
      }}
    >
      <td
        style={{
          padding: "15px 20px",
          fontSize: 15,
          fontWeight: 600,
          color: hov ? "#ff9a2e" : "#000",
          fontFamily: "Calibri, sans-serif",
          borderLeft: hov ? "4px solid #ff7e22" : "4px solid transparent",
          transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {a.nombre ?? "—"}
      </td>
      <td style={{ padding: "15px 20px" }}>
        <span
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: 16,
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            background: "rgba(250,130,0,.12)",
            color: "#d67c00",
            border: "1.5px solid rgba(250,130,0,.25)",
            fontFamily: "Calibri, sans-serif",
            transition: "all .2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(250,130,0,.2)"; e.currentTarget.style.borderColor = "rgba(250,130,0,.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(250,130,0,.12)"; e.currentTarget.style.borderColor = "rgba(250,130,0,.25)"; }}
        >
          {TIPO_LABEL[a.tipo]}
        </span>
      </td>
      <td style={{ padding: "15px 20px", fontSize: 15, color: "#000", fontFamily: "Calibri, sans-serif", fontWeight: 500 }}>
        {a.codigoServicio ?? "—"}
      </td>
      <td style={{ padding: "15px 20px", fontSize: 15, color: "#666", fontFamily: "Calibri, sans-serif" }}>
        {new Date(a.actualizadoEn).toLocaleString("es-CO", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </td>
    </tr>
  );
}
