import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AssetList from "./pages/AssetList";
import AssetDetail from "./pages/AssetDetail/index";
import Papelera from "./pages/Papelera";
import Login from "./pages/Login";
import { isAuthenticated } from "./api/auth";
import FirmaMovil from "./pages/FirmaMovil";

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

        {/* ✅ RUTAS PÚBLICAS */}
        <Route path="/login" element={<Login />} />
        <Route path="/firmar/:assetId" element={<FirmaMovil />} />

        {/* ✅ RUTAS PROTEGIDAS */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventario/:tipo" element={<AssetList />} />
          <Route path="activo/:id" element={<AssetDetail />} />
          <Route path="papelera" element={<Papelera />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}