import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AssetList from "./pages/AssetList";
import AssetDetail from "./pages/AssetDetail/index";
import Papelera from "./pages/Papelera";
import Login from "./pages/Login";
import FirmaMovil from "./pages/FirmaMovil";
import FirmaDevolucion from "./pages/FirmaDevolucion";
import { isAuthenticated } from "./api/auth";

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
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/firmar/:assetId" element={<FirmaMovil />} />
        <Route path="/firmar-devolucion/:assetId" element={<FirmaDevolucion />} />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"        element={<Dashboard />} />
          <Route path="inventario/:tipo" element={<AssetList />} />
          <Route path="activo/:id"       element={<AssetDetail />} />
          <Route path="/papelera"        element={<Papelera />} />
        </Route>

        {/* Cualquier ruta desconocida */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}