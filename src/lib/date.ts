type TenantKey = "co" | "pa";

const resolveTenantKey = (tenantKey?: string | null): TenantKey =>
  tenantKey === "pa" ? "pa" : "co";

const tenantTimeZone: Record<TenantKey, string> = {
  co: "America/Bogota",
  pa: "America/Panama",
};

export const getTenantLocalISODate = (tenantKey?: string | null, date = new Date()) => {
  const key = resolveTenantKey(tenantKey);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tenantTimeZone[key],
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
};
