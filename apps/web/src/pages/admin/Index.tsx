import React from "react";
export default function AdminIndex() {
  React.useEffect(() => { window.location.replace("/admin/dashboard"); }, []);
  return null;
}
