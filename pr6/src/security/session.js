import crypto from "node:crypto";

const sessions = new Map();
const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000;

function now() {
  return Date.now();
}

export function getCookieName() {
  const secure = isSecureCookies();
  return secure ? "__Host-bess_session" : "bess_session";
}

export function isSecureCookies() {
  return process.env.COOKIE_SECURE === "1" || process.env.NODE_ENV === "production";
}

export function createSession({ userId, role }) {
  const id = crypto.randomBytes(32).toString("base64url");
  const expiresAt = now() + DEFAULT_TTL_MS;
  sessions.set(id, { userId, role, createdAt: now(), expiresAt });
  return { id, expiresAt };
}

export function getSession(id) {
  if (!id) return null;
  const s = sessions.get(id);
  if (!s) return null;
  if (s.expiresAt <= now()) {
    sessions.delete(id);
    return null;
  }
  return { id, ...s };
}

export function deleteSession(id) {
  sessions.delete(id);
}

export function setSessionCookie(res, sessionId, { expiresAt }) {
  const secure = isSecureCookies();
  const name = getCookieName();
  const parts = [`${name}=${sessionId}`, "Path=/", "HttpOnly", "SameSite=Strict"];
  if (secure) parts.push("Secure");
  if (typeof expiresAt === "number") {
    const seconds = Math.max(0, Math.floor((expiresAt - now()) / 1000));
    parts.push(`Max-Age=${seconds}`);
  }
  res.setHeader("set-cookie", parts.join("; "));
}

export function clearSessionCookie(res) {
  const secure = isSecureCookies();
  const name = getCookieName();
  const parts = [`${name}=`, "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"];
  if (secure) parts.push("Secure");
  res.setHeader("set-cookie", parts.join("; "));
}

