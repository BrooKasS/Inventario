import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";

const C = {
  grad: "linear-gradient(135deg, #FA8200 0%, #861F41 35%, #B7312C 70%, #D86018 100%)",
  primary: "#B7312C",
  border: "#F0E8E8",
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
      fontFamily: "Calibri, sans-serif",
      padding: 16,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,.3)",
      }}>

        {/* Logo / título */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: C.grad,
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 26,
            margin: "0 auto 14px",
          }}>🖥️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
            Inventario TI
          </h1>
          <p style={{ color: "#888", fontSize: 13, marginTop: 6 }}>
            Ingresa con tus credenciales asignadas
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#ffebee", border: "1.5px solid #ffcdd2",
            borderRadius: 12, padding: "12px 16px", marginBottom: 18,
            fontSize: 13, color: "#d32f2f",
            display: "flex", alignItems: "center", gap: 8,
            fontWeight: 600,
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
            color: "#333", marginBottom: 8, opacity: 0.85,
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
              border: "1.5px solid #ddd", borderRadius: 12,
              fontSize: 14, fontFamily: "Calibri, sans-serif",
              outline: "none", boxSizing: "border-box",
              background: "#fafbfc",
              transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(183,49,44,.08)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#ddd"; e.currentTarget.style.background = "#fafbfc"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>

        {/* Contraseña */}
        <div style={{ marginBottom: 28 }}>
          <label style={{
            display: "block", fontSize: 11, fontWeight: 800,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: "#333", marginBottom: 8, opacity: 0.85,
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
              border: "1.5px solid #ddd", borderRadius: 12,
              fontSize: 14, fontFamily: "Calibri, sans-serif",
              outline: "none", boxSizing: "border-box",
              background: "#fafbfc",
              transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(183,49,44,.08)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#ddd"; e.currentTarget.style.background = "#fafbfc"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>

        {/* Botón */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "13px 16px",
            border: "none", borderRadius: 12,
            background: loading ? "#ccc" : C.grad,
            color: "#fff", fontWeight: 800, fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "Calibri, sans-serif",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
            transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: loading ? "0 2px 6px rgba(0,0,0,.1)" : "0 8px 20px rgba(183,49,44,.25)",
            transform: "translateY(0)",
            letterSpacing: "0.03em",
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(183,49,44,.35)"; } }}
          onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(183,49,44,.25)"; } }}
        >
          {loading ? "Verificando..." : "Ingresar"}
        </button>

      </div>
    </div>
  );
}