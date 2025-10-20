import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "./routes/AppShell";
import Landing from "./lib/landing";
import AdminDashboard from "./routes/admin/Dashboard";
import WorkspaceControle from "./routes/workspace/Controle";
import Login from "./routes/Login";
import "./index.css";
import LoginPage from "./pages/login"; // <= adicione

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage/> },
  { path: "/", element: <Landing/> },
  { path: "/", element: <AppShell/>, children: [
    { path: "/admin/dashboard", element: <AdminDashboard/> },
    { path: "/workspace/controle", element: <WorkspaceControle/> },
  ]}
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
);
