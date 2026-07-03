export const DEFAULT_TENANT_KEY = "co" as const;

export type TenantKey = "co" | "pa";

export const normalizeTenantKey = (tenantKey?: TenantKey | null): TenantKey =>
  tenantKey ?? DEFAULT_TENANT_KEY;

export const sameTenantKey = (
  recordTenantKey: TenantKey | undefined | null,
  tenantKey: TenantKey
) => normalizeTenantKey(recordTenantKey) === tenantKey;

export const isUserActive = (user?: { active?: boolean } | null) => user?.active !== false;

export const assertUserIsActive = (user?: { active?: boolean } | null) => {
  if (!isUserActive(user)) {
    throw new Error("Usuario temporalmente bloqueado.");
  }
};
