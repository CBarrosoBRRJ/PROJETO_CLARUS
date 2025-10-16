import React from "react";
import { RouteObject } from "react-router-dom";
const Login = React.lazy(() => import("./pages/login"));
const Admin = React.lazy(() => import("./pages/admin"));
const Dashboard = React.lazy(() => import("./pages/admin/dashboard"));

export const routes: RouteObject[] = [
  { path: "/login", element: <Login /> },
  { path: "/admin", element: <Admin /> },
  { path: "/admin/dashboard", element: <Dashboard /> },
  { path: "/", element: <Login /> },
];
