import React from "react";
import { Navigate } from "react-router-dom";
import { isStaff } from "../lib/rbac";
let user:any=null;
try { user = (require("@auth0/auth0-react") as any).useAuth0?.().user || (window as any).__clarus_user || null } catch {}
export default function Landing(){ return <Navigate to={isStaff(user)?"/admin/dashboard":"/workspace/controle"} replace/> }
