import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

function toFsPath(path) {
  return path instanceof URL ? fileURLToPath(path) : path;
}

export async function readJsonFile(path, fallback) {
  try {
    const raw = await readFile(toFsPath(path), "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(path, data) {
  const fsPath = toFsPath(path);
  await mkdir(dirname(fsPath), { recursive: true });
  const tmp = `${fsPath}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await rename(tmp, fsPath);
}
