import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

// Lazy pages
const Login = React.lazy(() => import("./pages/login"));
const Admin = React.lazy(() => import("./pages/admin"));
const Dashboard = React.lazy(() => import("./pages/admin/dashboard"));

function AppRoutes() {
  return (
    <React.Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={React.createElement((Login as any).default ?? Login)} />
        <Route path="/admin" element={React.createElement((Admin as any).default ?? Admin)} />
        <Route path="/admin/dashboard" element={React.createElement((Dashboard as any).default ?? Dashboard)} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </React.Suspense>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>
);
