import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AssetList from "./pages/AssetList";
import AssetDetail from "./pages/AssetDetail/index";
import Papelera from "./pages/Papelera";
import Login from "./pages/Login";
import FirmaMovil from "./pages/FirmaMovil";
import FirmaDevolucion from "./pages/FirmaDevolucion";
import SoftwareInventario from "./pages/SoftwareInventario";
import { isAuthenticated } from "./api/auth";
import MobileStagingPage from "./pages/MobileStating";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/firmar/:assetId" element={<FirmaMovil />} />
        <Route path="/firmar-devolucion/:assetId" element={<FirmaDevolucion />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"              element={<Dashboard />} />
          <Route path="inventario/:tipo"       element={<AssetList />} />
          <Route path="activo/:id"             element={<AssetDetail />} />
          <Route path="mobile-staging" element={<MobileStagingPage />} />
          <Route path="/papelera"              element={<Papelera />} />
          <Route path="/inventario/software"   element={<SoftwareInventario />} /> {/* ← NUEVO */}
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}