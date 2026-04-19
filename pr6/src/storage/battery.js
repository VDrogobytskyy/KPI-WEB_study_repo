import { readJsonFile, writeJsonFile } from "./json-store.js";

const BATTERY_PATH = new URL("../../data/battery.json", import.meta.url);

const DEFAULT_STATE = {
  soc: 50,
  mode: "idle",
  setpointKw: 0,
  emergencyStop: false,
  updatedAt: new Date().toISOString(),
};

export async function readBatteryState() {
  const data = await readJsonFile(BATTERY_PATH, DEFAULT_STATE);
  if (!data || typeof data !== "object") return { ...DEFAULT_STATE };
  return {
    ...DEFAULT_STATE,
    ...data,
  };
}

export async function writeBatteryState(next) {
  const state = {
    ...next,
    soc: clampNumber(next.soc, 0, 100),
    updatedAt: new Date().toISOString(),
  };
  await writeJsonFile(BATTERY_PATH, state);
  return state;
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

