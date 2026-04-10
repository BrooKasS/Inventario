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
        borderRadius: 18,
        padding: "26px 24px",
        boxShadow: hov ? "0 20px 48px rgba(0, 0, 0, .2)" : "0 8px 24px rgba(78, 78, 78, 0.12)",
        cursor: onClick ? "pointer" : "default",
        transition: "all .35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: hov ? "translateY(-6px) scale(1.03)" : "translateY(0) scale(1)",
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
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "rgba(255,255,255,.12)",
          transition: "all .4s",
          transform: hov ? "scale(1.2)" : "scale(1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 8,
          bottom: -30,
          width: 70,
          height: 70,
          borderRadius: "50%",
          background: "rgba(0, 0, 0, .05)",
          transition: "all .4s",
          transform: hov ? "scale(1.15)" : "scale(1)",
        }}
      />
      {icon && (
        <div
          style={{
            fontSize: 36,
            marginBottom: 14,
            lineHeight: 1,
            display: "inline-block",
            transition: "transform .35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transform: hov ? "scale(1.3) rotate(5deg)" : "scale(1) rotate(0deg)",
            filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, .15))",
          }}
        >
          {icon}
        </div>
      )}
      <div
        style={{
          fontSize: 44,
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1,
          marginBottom: 8,
          textShadow: "0 2px 12px rgba(0,0,0,.25)",
          letterSpacing: "-0.01em",
        }}
      >
        {value ?? "—"}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,.8)",
        }}
      >
        {label}
      </div>
    </div>
  );
}
