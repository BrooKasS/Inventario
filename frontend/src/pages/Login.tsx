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
            background: "#fff0f0", border: "1.5px solid #f5c6c6",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16,
            fontSize: 13, color: "#c0392b",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Usuario */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: "block", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: C.primary, marginBottom: 6,
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
              width: "100%", padding: "10px 12px",
              border: "1.5px solid #e0e0e0", borderRadius: 8,
              fontSize: 14, fontFamily: "Calibri, sans-serif",
              outline: "none", boxSizing: "border-box",
            }}
            onFocus={e => e.currentTarget.style.borderColor = C.primary}
            onBlur={e => e.currentTarget.style.borderColor = "#e0e0e0"}
          />
        </div>

        {/* Contraseña */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: "block", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: C.primary, marginBottom: 6,
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
              width: "100%", padding: "10px 12px",
              border: "1.5px solid #e0e0e0", borderRadius: 8,
              fontSize: 14, fontFamily: "Calibri, sans-serif",
              outline: "none", boxSizing: "border-box",
            }}
            onFocus={e => e.currentTarget.style.borderColor = C.primary}
            onBlur={e => e.currentTarget.style.borderColor = "#e0e0e0"}
          />
        </div>

        {/* Botón */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "12px",
            border: "none", borderRadius: 8,
            background: loading ? "#ccc" : C.grad,
            color: "#fff", fontWeight: 700, fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "Calibri, sans-serif",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
          }}
        >
          {loading ? "Verificando..." : "Ingresar"}
        </button>

      </div>
    </div>
  );
}