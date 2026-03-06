type TenantKey = "co" | "pa";

const resolveTenantKey = (tenantKey?: string | null): TenantKey =>
  tenantKey === "pa" ? "pa" : "co";

export const formatLotCode = (number: number, tenantKey?: string | null) => {
  const tenant = resolveTenantKey(tenantKey);
  const prefix = tenant === "pa" ? "PA" : "CO";
  const normalized = Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
  return `${prefix}-${String(normalized).padStart(2, "0")}`;
};
