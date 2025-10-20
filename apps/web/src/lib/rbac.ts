export type ClarusUser = any;
export function isStaff(user: ClarusUser | null | undefined): boolean {
  if (!user) return false;
  try {
    const am = (user as any).app_metadata || (user as any).appMetadata;
    if (am?.is_staff === true) return true;
    const claimStaff = (user as any)["https://clarus.app/is_staff"];
    if (claimStaff === true) return true;
    const roles = (user as any)["https://clarus.app/roles"] || am?.roles || (user as any).roles || [];
    if (Array.isArray(roles) && roles.some((r) => String(r).toUpperCase().includes("STAFF"))) return true;
    const org = (user as any)["https://clarus.app/org"] || am?.org || am?.organization;
    if (typeof org === "string" && org.toLowerCase().includes("clarus")) return true;
  } catch {}
  return false;
}
