import { URL } from "node:url";

export function parseUrl(req) {
  const url = new URL(req.url ?? "/", "http://localhost");
  return { pathname: url.pathname, searchParams: url.searchParams };
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function sendText(res, statusCode, text) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.end(text);
}

export function getHeader(req, name) {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value.join(", ");
  return value ?? "";
}

export function parseCookies(req) {
  const header = getHeader(req, "cookie");
  const out = new Map();
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    out.set(key, value);
  }
  return out;
}

