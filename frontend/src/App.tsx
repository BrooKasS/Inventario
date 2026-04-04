import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AssetList from "./pages/AssetList";
import AssetDetail from "./pages/AssetDetail/index";
import Papelera from "./pages/Papelera";
import Login from "./pages/login";
import { isAuthenticated } from "./api/auth";

/**
 * ProtectedRoute — si no hay token redirige a /login.
 * Si hay token deja pasar.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Ruta pública — fuera del Layout */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas — dentro del Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"          element={<Dashboard />} />
          <Route path="inventario/:tipo"   element={<AssetList />} />
          <Route path="activo/:id"         element={<AssetDetail />} />
          <Route path="/papelera"          element={<Papelera />} />
        </Route>

        {/* Cualquier ruta desconocida → dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}