export const DEFAULT_TENANT_KEY = "co" as const;

export type TenantKey = "co" | "pa";

export const normalizeTenantKey = (tenantKey?: TenantKey | null): TenantKey =>
  tenantKey ?? DEFAULT_TENANT_KEY;

export const sameTenantKey = (
  recordTenantKey: TenantKey | undefined | null,
  tenantKey: TenantKey
) => normalizeTenantKey(recordTenantKey) === tenantKey;

