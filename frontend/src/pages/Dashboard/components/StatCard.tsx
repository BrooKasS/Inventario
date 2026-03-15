import { useState } from "react";

interface StatCardProps {
  icon?: string;
  label: string;
  value: number | string | undefined;
  grad: string;
  onClick?: () => void;
  
}

export default function StatCard({ icon, label, value, grad, onClick }: StatCardProps) {
  const [hov, setHov] = useState(false);
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: grad,
        borderRadius: 14,
        padding: "22px 20px",
        boxShadow: hov ? "0 12px 32px rgb(104, 104, 104)" : "0 4px 16px rgba(78, 78, 78, 0.82)",
        cursor: onClick ? "pointer" : "default",
        transition: "all .2s",
        transform: hov ? "translateY(-4px) scale(1.02)" : "none",
        fontFamily: "Calibri, 'Segoe UI', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -20,
          top: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(255,255,255,.10)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 12,
          bottom: -26,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "rgba(22, 21, 21, 0.07)",
        }}
      />
      {icon && (
        <div
          style={{
            fontSize: 28,
            marginBottom: 12,
            lineHeight: 1,
            display: "inline-block",
            transition: "transform .2s",
            transform: hov ? "scale(1.2)" : "scale(1)",
            filter: "drop-shadow(0 2px 6px rgba(255, 1, 1, 0.25))",
          }}
        >
          {icon}
        </div>
      )}
      <div
        style={{
          fontSize: 38,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1,
          marginBottom: 6,
          textShadow: "0 2px 8px rgba(0,0,0,.2)",
        }}
      >
        {value ?? "—"}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,.75)",
        }}
      >
        {label}
      </div>
    </div>
  );
}
