import { createHmac, timingSafeEqual } from "crypto";

export const PMR_COOKIE_NAME = "pmr_session";

const DEFAULT_PMR_ACCESS_KEY = "panama2026";
const DEFAULT_PMR_SESSION_SECRET = "pmr-panama-session-secret";
const PMR_TOKEN_PAYLOAD = "pmr:panama:viewer";

const getSessionSecret = () =>
  (process.env.PMR_SESSION_SECRET ?? DEFAULT_PMR_SESSION_SECRET).trim();

export const getPmrAccessKey = () =>
  (process.env.PMR_ACCESS_KEY ?? DEFAULT_PMR_ACCESS_KEY).trim();

const signPayload = (payload: string) =>
  createHmac("sha256", getSessionSecret()).update(payload).digest("hex");

export const createPmrSessionToken = () => {
  const signature = signPayload(PMR_TOKEN_PAYLOAD);
  return `${PMR_TOKEN_PAYLOAD}.${signature}`;
};

export const isValidPmrSessionToken = (value?: string | null) => {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  if (payload !== PMR_TOKEN_PAYLOAD) return false;

  const expected = signPayload(payload);
  const providedBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;

  return timingSafeEqual(providedBuf, expectedBuf);
};

export const isValidPmrPassword = (password?: string | null) =>
  (password ?? "").trim() === getPmrAccessKey();
