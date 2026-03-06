type TenantKey = "co" | "pa";

const resolveTenantKey = (tenantKey?: string | null): TenantKey =>
  tenantKey === "pa" ? "pa" : "co";

const CURRENCY_CONFIG: Record<TenantKey, { locale: string; currency: string }> = {
  co: { locale: "es-CO", currency: "COP" },
  pa: { locale: "en-US", currency: "USD" },
};

export const formatMoneyByTenant = (value: number, tenantKey?: string | null) => {
  const key = resolveTenantKey(tenantKey);
  const { locale, currency } = CURRENCY_CONFIG[key];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};
