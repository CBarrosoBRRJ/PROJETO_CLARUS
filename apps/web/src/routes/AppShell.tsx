import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
export function AppShell(){ return(<div className="flex min-h-screen"><Sidebar/><main className="flex-1"><Outlet/></main></div>)}
