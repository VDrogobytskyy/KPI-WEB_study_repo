import crypto from "node:crypto";

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const keyLen = 64;

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLen, { N: 16384, r: 8, p: 1 }, (err, buf) => {
      if (err) reject(err);
      else resolve(buf);
    });
  });

  return {
    algo: "scrypt",
    params: { keyLen, N: 16384, r: 8, p: 1 },
    salt: salt.toString("base64"),
    hash: Buffer.from(derivedKey).toString("base64"),
  };
}

export async function verifyPassword(password, stored) {
  if (!stored || stored.algo !== "scrypt") return false;

  const salt = Buffer.from(stored.salt, "base64");
  const expected = Buffer.from(stored.hash, "base64");
  const keyLen = stored.params?.keyLen ?? expected.length;
  const N = stored.params?.N ?? 16384;
  const r = stored.params?.r ?? 8;
  const p = stored.params?.p ?? 1;

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLen, { N, r, p }, (err, buf) => {
      if (err) reject(err);
      else resolve(buf);
    });
  });

  const actual = Buffer.from(derivedKey);
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

