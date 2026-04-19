import { sendJson } from "../security/http.js";
import { badRequest } from "../security/input.js";
import { hashPassword, verifyPassword } from "../security/password.js";
import { parseCookies } from "../security/http.js";
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getCookieName,
  setSessionCookie,
} from "../security/session.js";
import { createUser, getUserByUsername } from "../storage/users.js";

function validateUsername(username) {
  if (typeof username !== "string") return false;
  if (username.length < 3 || username.length > 32) return false;
  return /^[a-zA-Z0-9_]+$/.test(username);
}

function validatePassword(password) {
  if (typeof password !== "string") return false;
  return password.length >= 8 && password.length <= 128;
}

function resolveRole(body) {
  const requested = String(body.role ?? "operator");
  if (requested !== "supervisor") return "operator";

  const token = String(body.supervisorToken ?? "");
  const expected = String(process.env.SUPERVISOR_REGISTRATION_TOKEN ?? "");
  if (expected && token === expected) return "supervisor";
  return "operator";
}

export async function handleRegister(req, res) {
  const { username, password } = req.body ?? {};
  if (!validateUsername(username)) return badRequest(res, "invalid_username", "Use 3-32 chars: letters, digits, _");
  if (!validatePassword(password)) return badRequest(res, "invalid_password", "Password must be 8-128 chars");

  const role = resolveRole(req.body ?? {});
  const pwd = await hashPassword(password);

  try {
    const user = await createUser({ username, role, password: pwd });
    return sendJson(res, 201, { ok: true, user });
  } catch (err) {
    if (err?.statusCode) return sendJson(res, err.statusCode, { error: err.message });
    throw err;
  }
}

export async function handleLogin(req, res) {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string") {
    return badRequest(res, "invalid_credentials", "Username and password are required");
  }

  const user = await getUserByUsername(username);
  if (!user) {
    clearSessionCookie(res);
    return sendJson(res, 401, { error: "invalid_credentials" });
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    clearSessionCookie(res);
    return sendJson(res, 401, { error: "invalid_credentials" });
  }

  const cookies = parseCookies(req);
  const existing = cookies.get(getCookieName());
  if (existing) deleteSession(existing);

  const session = createSession({ userId: user.id, role: user.role });
  setSessionCookie(res, session.id, { expiresAt: session.expiresAt });

  return sendJson(res, 200, { ok: true, user: { id: user.id, username: user.username, role: user.role } });
}
