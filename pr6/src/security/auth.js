import { parseCookies, sendJson } from "./http.js";
import { getCookieName, getSession } from "./session.js";
import { getUserById } from "../storage/users.js";

export async function requireAuth(req, res) {
  const cookies = parseCookies(req);
  const sid = cookies.get(getCookieName()) ?? "";
  const session = getSession(sid);
  if (!session) {
    sendJson(res, 401, { error: "unauthorized" });
    return null;
  }
  const user = await getUserById(session.userId);
  if (!user) {
    sendJson(res, 401, { error: "unauthorized" });
    return null;
  }
  return { id: user.id, username: user.username, role: user.role };
}

export function requireRole(req, res, roles) {
  if (!req.user) {
    sendJson(res, 401, { error: "unauthorized" });
    return false;
  }
  if (!roles.includes(req.user.role)) {
    sendJson(res, 403, { error: "forbidden" });
    return false;
  }
  return true;
}
