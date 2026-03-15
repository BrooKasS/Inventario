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
        background: hov ? "rgba(250, 129, 0, 0.27)" : "transparent",
        transition: "background .15s",
        borderBottom: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <td
        style={{
          padding: "13px 18px",
          fontSize: 15,
          fontWeight: 600,
          color: hov ? "#ff8800" : "#000000",
          fontFamily: "Calibri, sans-serif",
          borderLeft: hov ? "3px solid #ff7e22" : "3px solid transparent",
          transition: "all .40s",
        }}
      >
        {a.nombre ?? "—"}
      </td>
      <td style={{ padding: "13px 18px" }}>
        <span
          style={{
            display: "inline-block",
            padding: "3px 12px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            background: "rgba(250,130,0,.18)",
            color: "#FA8200",
            border: "1px solid rgba(250,130,0,.3)",
            fontFamily: "Calibri, sans-serif",
          }}
        >
          {TIPO_LABEL[a.tipo]}
        </span>
      </td>
      <td style={{ padding: "13px 18px", fontSize: 15, color: "rgb(0, 0, 0)", fontFamily: "Calibri, sans-serif" }}>
        {a.codigoServicio ?? "—"}
      </td>
      <td style={{ padding: "13px 18px", fontSize: 15, color: "rgb(0, 0, 0)", fontFamily: "Calibri, sans-serif" }}>
        {new Date(a.actualizadoEn).toLocaleString("es-CO", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </td>
    </tr>
  );
}
