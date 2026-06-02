import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";

const C = {
  grad: "linear-gradient(135deg, #FF9A1F 0%, #8A1A40 32%, #B7312C 66%, #D86018 100%)",
  gradSoft: "linear-gradient(135deg, rgba(255,154,31,.22), rgba(183,49,44,.18))",
  primary: "#B7312C",
  border: "#F0E8E8",
  ink: "#1b1b1d",
  muted: "#6b6b72",
};

export default function Login() {
  const navigate = useNavigate();
  const [usuario,  setUsuario]  = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async () => {
     setError(null);
    if (!usuario || !password) {
      setError("Ingresa usuario y contraseña");
      return;
    }
    setLoading(true);
     setError(null);
    try {
      await loginUser(usuario, password);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.grad,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Sora', 'Space Grotesk', 'Segoe UI', sans-serif",
      padding: 18,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: "-20% -10% auto auto",
        width: 420,
        height: 420,
        background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,.35), rgba(255,255,255,0) 60%)",
        filter: "blur(6px)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        inset: "auto auto -30% -10%",
        width: 480,
        height: 480,
        background: "radial-gradient(circle at 70% 60%, rgba(255,255,255,.28), rgba(255,255,255,0) 62%)",
        filter: "blur(4px)",
        pointerEvents: "none",
      }} />
      <div style={{
        background: "rgba(255,255,255,.96)",
        borderRadius: 20,
        padding: "36px 32px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 24px 70px rgba(0,0,0,.28)",
        border: "1px solid rgba(255,255,255,.6)",
        backdropFilter: "blur(6px)",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          inset: "10px",
          borderRadius: 18,
          background: C.gradSoft,
          opacity: 0.35,
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>

        {/* Logo / título */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{
            width: 66, height: 66, borderRadius: 18,
            background: C.grad,
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 28,
            margin: "0 auto 14px",
            boxShadow: "0 10px 22px rgba(183,49,44,.28)",
          }}>🖥️</div>
          <div style={{
            fontSize: 30, letterSpacing: "0.18em",
            fontWeight: 900, color: C.ink,
          }}>
            VAULTIS
          </div>
          <div style={{
            fontSize: 11, fontWeight: 800, color: C.muted,
            letterSpacing: "0.32em", textTransform: "uppercase",
            marginTop: 4,
          }}>
            Inventario TI
          </div>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 10 }}>
            Accede con tus credenciales corporativas
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#ffebee", border: "1.5px solid #ffcdd2",
            borderRadius: 12, padding: "12px 16px", marginBottom: 18,
            fontSize: 13, color: "#d32f2f",
            display: "flex", alignItems: "center", gap: 8,
            fontWeight: 700,
            boxShadow: "0 6px 16px rgba(211,47,47,.15)",
            animation: "slideUp .3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Usuario */}
        <div style={{ marginBottom: 18 }}>
          <label style={{
            display: "block", fontSize: 11, fontWeight: 800,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: C.ink, marginBottom: 8, opacity: 0.82,
          }}>
            Usuario
          </label>
          <input
            type="text"
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Tu usuario de red"
            style={{
              width: "100%", padding: "12px 14px",
              border: "1.5px solid #e1d8d8", borderRadius: 12,
              fontSize: 14, fontFamily: "'Sora', 'Space Grotesk', 'Segoe UI', sans-serif",
              outline: "none", boxSizing: "border-box",
              background: "#fafbfc",
              transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,.03)",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(183,49,44,.12)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#e1d8d8"; e.currentTarget.style.background = "#fafbfc"; e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,.03)"; }}
          />
        </div>

        {/* Contraseña */}
        <div style={{ marginBottom: 28 }}>
          <label style={{
            display: "block", fontSize: 11, fontWeight: 800,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: C.ink, marginBottom: 8, opacity: 0.82,
          }}>
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Tu contraseña de Windows"
            style={{
              width: "100%", padding: "12px 14px",
              border: "1.5px solid #e1d8d8", borderRadius: 12,
              fontSize: 14, fontFamily: "'Sora', 'Space Grotesk', 'Segoe UI', sans-serif",
              outline: "none", boxSizing: "border-box",
              background: "#fafbfc",
              transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,.03)",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(183,49,44,.12)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#e1d8d8"; e.currentTarget.style.background = "#fafbfc"; e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,.03)"; }}
          />
        </div>

        {/* Botón */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "13px 16px",
            border: "none", borderRadius: 12,
            background: loading ? "#cfc4c4" : C.grad,
            color: "#fff", fontWeight: 800, fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Sora', 'Space Grotesk', 'Segoe UI', sans-serif",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
            transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: loading ? "0 2px 6px rgba(0,0,0,.1)" : "0 10px 26px rgba(183,49,44,.3)",
            transform: "translateY(0)",
            letterSpacing: "0.03em",
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 30px rgba(183,49,44,.38)"; } }}
          onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 26px rgba(183,49,44,.3)"; } }}
        >
          {loading ? "Verificando..." : "Ingresar"}
        </button>
        </div>

      </div>
    </div>
  );
}