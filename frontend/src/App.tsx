import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AssetList from "./pages/AssetList";
import AssetDetail from "./pages/AssetDetail/index";
import Papelera from "./pages/Papelera";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventario/:tipo" element={<AssetList />} />
          <Route path="activo/:id" element={<AssetDetail />} />
          <Route path="/papelera" element={<Papelera />} />
          
          
        </Route>
      
      </Routes>
    </BrowserRouter>
  );
}