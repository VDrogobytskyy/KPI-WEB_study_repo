import { sendJson } from "./http.js";

export async function readJsonBody(req, { maxBytes }) {
  const contentType = String(req.headers["content-type"] ?? "");
  if (!contentType.toLowerCase().includes("application/json")) return {};

  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      const error = new Error("payload_too_large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
    return {};
  } catch {
    const error = new Error("invalid_json");
    error.statusCode = 400;
    throw error;
  }
}

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const MAX_STRING_LENGTH = 4096;

function sanitizeValue(value) {
  if (typeof value === "string") {
    const cleaned = value.replace(CONTROL_CHARS, "").trim();
    return cleaned.length > MAX_STRING_LENGTH ? cleaned.slice(0, MAX_STRING_LENGTH) : cleaned;
  }
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") return sanitizeObject(value);
  return value;
}

function sanitizeObject(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const safeKey = String(key).replace(CONTROL_CHARS, "").trim();
    if (!safeKey) continue;
    out[safeKey] = sanitizeValue(value);
  }
  return out;
}

export function sanitizeJsonBody(body) {
  if (!body || typeof body !== "object") return {};
  return sanitizeValue(body);
}

export function badRequest(res, code, message) {
  return sendJson(res, 400, { error: code, message });
}
