import { sendJson } from "../security/http.js";
import { badRequest } from "../security/input.js";
import { readBatteryState, writeBatteryState } from "../storage/battery.js";

export async function getBatteryStatus(req, res) {
  const state = await readBatteryState();
  return sendJson(res, 200, { ok: true, state });
}

export async function postBatteryCharge(req, res) {
  const { action, rateKw, deltaPercent, resetEmergency } = req.body ?? {};
  const normalizedAction = String(action ?? "").toLowerCase();
  if (!["charge", "discharge", "idle"].includes(normalizedAction)) {
    return badRequest(res, "invalid_action", "action must be: charge | discharge | idle");
  }

  const state = await readBatteryState();

  if (state.emergencyStop) {
    const wantsReset = resetEmergency === true || resetEmergency === "true";
    if (req.user?.role !== "supervisor" || !wantsReset) {
      return sendJson(res, 409, { error: "emergency_stop_active" });
    }
    state.emergencyStop = false;
  }

  const next = { ...state };
  next.mode = normalizedAction === "idle" ? "idle" : normalizedAction === "charge" ? "charging" : "discharging";
  next.setpointKw = Number.isFinite(Number(rateKw)) ? Number(rateKw) : 0;

  if (deltaPercent !== undefined) {
    const d = Number(deltaPercent);
    if (!Number.isFinite(d) || d < 0 || d > 100) {
      return badRequest(res, "invalid_delta", "deltaPercent must be 0..100");
    }
    if (normalizedAction === "charge") next.soc = Math.min(100, next.soc + d);
    if (normalizedAction === "discharge") next.soc = Math.max(0, next.soc - d);
  }

  const saved = await writeBatteryState(next);
  return sendJson(res, 200, { ok: true, state: saved });
}

export async function postEmergencyStop(req, res) {
  const state = await readBatteryState();
  const next = {
    ...state,
    mode: "stopped",
    setpointKw: 0,
    emergencyStop: true,
  };
  const saved = await writeBatteryState(next);
  return sendJson(res, 200, { ok: true, state: saved });
}

