const express = require("express");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname);
const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generateNextState(previous, skipCyclesIncrease) {
  const powerDelta = randomBetween(-80, 80);
  let power = previous.power + powerDelta;
  power = clamp(power, -260, 260);

  let soc = previous.soc + power / 850;
  soc = clamp(soc, 12, 96);

  const voltage = 680 + soc * 0.9 + randomBetween(-6, 6);
  const current = power === 0 ? 0 : (power * 1000) / voltage;

  const temperatureShift = Math.abs(power) / 190 + randomBetween(-1.2, 1.2);
  let temperature = previous.temperature * 0.7 + (24 + temperatureShift) * 0.3;
  temperature = clamp(temperature, 18, 46);

  const cyclesIncrease =
    !skipCyclesIncrease && Math.abs(power) > 180 && randomBetween(0, 1) > 0.65 ? 1 : 0;
  const cycles = previous.cycles + cyclesIncrease;
  const mode = power >= 0 ? "Заряд" : "Розряд";

  return {
    soc: Number(soc.toFixed(1)),
    power: Math.round(power),
    voltage: Math.round(voltage),
    current: Math.round(current),
    temperature: Number(temperature.toFixed(1)),
    cycles,
    mode,
    online: true,
  };
}

let state = {
  soc: 64,
  power: 120,
  voltage: 728,
  current: 165,
  temperature: 27,
  cycles: 913,
  mode: "Заряд",
  online: true,
};

const history = [];

function pushHistory(snapshot) {
  history.push({ ts: new Date().toISOString(), power: snapshot.power });
  if (history.length > 500) history.splice(0, history.length - 500);
}
for (let i = 0; i < 15; i += 1) {
  state = generateNextState(state, true);
  pushHistory(state);
}
pushHistory(state);

setInterval(() => {
  state = generateNextState(state, false);
  pushHistory(state);
}, 2200);

const app = express();

app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.get("/api/bess", (req, res) => {
  res.json({ ts: new Date().toISOString(), ...state });
});

app.get("/api/bess/history", (req, res) => {
  const limitRaw = Number.parseInt(String(req.query.limit ?? "16"), 10);
  const limit = clamp(Number.isFinite(limitRaw) ? limitRaw : 16, 1, 200);
  res.json({ limit, items: history.slice(-limit) });
});

app.use(
  express.static(ROOT_DIR, {
    maxAge: "5m",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-store");
    },
  })
);

app.listen(PORT, "127.0.0.1", () => {
  console.log(`BESS server running at http://127.0.0.1:${PORT}`);
});
