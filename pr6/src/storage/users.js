import crypto from "node:crypto";
import { readJsonFile, writeJsonFile } from "./json-store.js";

const USERS_PATH = new URL("../../data/users.json", import.meta.url);

let cache = null;

async function loadUsers() {
  if (cache) return cache;
  cache = await readJsonFile(USERS_PATH, { users: [] });
  if (!cache.users || !Array.isArray(cache.users)) cache = { users: [] };
  return cache;
}

function normalizeUsername(username) {
  return String(username).toLowerCase();
}

export async function createUser({ username, role, password }) {
  const store = await loadUsers();
  const usernameLower = normalizeUsername(username);

  if (store.users.some((u) => u.usernameLower === usernameLower)) {
    const error = new Error("username_taken");
    error.statusCode = 409;
    throw error;
  }

  const id = crypto.randomUUID();
  const user = {
    id,
    username,
    usernameLower,
    role,
    password,
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  await writeJsonFile(USERS_PATH, store);
  return { id: user.id, username: user.username, role: user.role };
}

export async function getUserByUsername(username) {
  const store = await loadUsers();
  const usernameLower = normalizeUsername(username);
  return store.users.find((u) => u.usernameLower === usernameLower) ?? null;
}

export async function getUserById(id) {
  const store = await loadUsers();
  return store.users.find((u) => u.id === id) ?? null;
}
