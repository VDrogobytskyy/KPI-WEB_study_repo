import { getHeader } from "./http.js";

export function withSecurityHeaders(res) {
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("referrer-policy", "no-referrer");
  res.setHeader("cache-control", "no-store");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("strict-transport-security", "max-age=15552000; includeSubDomains");
  }
}

export function withHttpsRedirect(req, res) {
  const enabled = process.env.ENABLE_HTTPS_REDIRECT === "1" || process.env.NODE_ENV === "production";
  if (!enabled) return false;

  const proto = getHeader(req, "x-forwarded-proto");
  if (proto && proto.toLowerCase() === "https") return false;

  const host = getHeader(req, "host");
  if (!host) return false;

  const location = `https://${host}${req.url ?? "/"}`;
  res.statusCode = 308;
  res.setHeader("location", location);
  res.end();
  return true;
}
