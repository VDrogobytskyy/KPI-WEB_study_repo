import { parseUrl, sendJson, sendText } from "./security/http.js";
import { requireAuth, requireRole } from "./security/auth.js";
import { sanitizeJsonBody, readJsonBody } from "./security/input.js";
import { handleRegister, handleLogin } from "./services/auth-service.js";
import {
  getBatteryStatus,
  postBatteryCharge,
  postEmergencyStop,
} from "./services/battery-service.js";

const routes = [
  { method: "POST", path: "/auth/register", handler: handleRegister, auth: false },
  { method: "POST", path: "/auth/login", handler: handleLogin, auth: false },
  {
    method: "GET",
    path: "/api/battery/status",
    handler: getBatteryStatus,
    auth: true,
    roles: ["operator", "supervisor"],
  },
  {
    method: "POST",
    path: "/api/battery/charge",
    handler: postBatteryCharge,
    auth: true,
    roles: ["operator", "supervisor"],
  },
  {
    method: "POST",
    path: "/api/battery/emergency-stop",
    handler: postEmergencyStop,
    auth: true,
    roles: ["supervisor"],
  },
];

export async function router(req, res) {
  const { pathname } = parseUrl(req);

  if (req.method === "GET" && pathname === "/") {
    return sendText(res, 200, "BESS Management API (Variant 6)\n");
  }

  const route = routes.find((r) => r.method === req.method && r.path === pathname);
  if (!route) return sendJson(res, 404, { error: "not_found" });

  if (req.method === "POST") {
    try {
      const body = await readJsonBody(req, { maxBytes: 256 * 1024 });
      req.body = sanitizeJsonBody(body);
    } catch (err) {
      const statusCode = err?.statusCode ?? 400;
      return sendJson(res, statusCode, { error: err?.message ?? "bad_request" });
    }
  }

  if (route.auth) {
    const user = await requireAuth(req, res);
    if (!user) return;
    req.user = user;
    if (route.roles?.length) {
      if (!requireRole(req, res, route.roles)) return;
    }
  }

  await route.handler(req, res);
}
