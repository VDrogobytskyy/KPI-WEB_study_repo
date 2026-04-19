import http from "node:http";
import { readFileSync } from "node:fs";
import { router } from "./router.js";
import { withSecurityHeaders, withHttpsRedirect } from "./security/middleware.js";

const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const HOST = process.env.HOST ?? "localhost";

const server = http.createServer(async (req, res) => {
  try {
    withSecurityHeaders(res);
    if (withHttpsRedirect(req, res)) return;
    await router(req, res);
  } catch (error) {
    console.error(error);
    const statusCode =
      Number.isInteger(error?.statusCode) && error.statusCode >= 400 && error.statusCode < 600
        ? error.statusCode
        : 500;
    res.statusCode = statusCode;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: statusCode === 500 ? "internal_server_error" : String(error?.message ?? "error") }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`BESS API listening on http://${HOST}:${PORT}`);
});

try {
  readFileSync(new URL("../data/.keep", import.meta.url));
} catch {

}
