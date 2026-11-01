const crypto = require("node:crypto");

const SCRYPT_PARAMETERS = { N: 32768, r: 8, p: 1 };

const generarHashContrasena = (contrasena) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(contrasena, salt, 64, {
    ...SCRYPT_PARAMETERS,
    maxmem: 128 * 1024 * 1024,
  });
  return `scrypt:${SCRYPT_PARAMETERS.N}:${SCRYPT_PARAMETERS.r}:${SCRYPT_PARAMETERS.p}$${salt}$${hash.toString("hex")}`;
};

const verificarHashContrasena = (contrasena, hashAlmacenado) => {
  if (typeof hashAlmacenado !== "string") return false;

  const [algoritmo, salt, hashHex] = hashAlmacenado.split("$");
  if (!salt || !hashHex || !/^[a-f\d]+$/i.test(hashHex) || hashHex.length % 2) {
    return false;
  }

  const expected = Buffer.from(hashHex, "hex");
  let actual;

  if (algoritmo.startsWith("scrypt:")) {
    const parametros = algoritmo.split(":").slice(1).map(Number);
    if (
      parametros.length !== 3 ||
      parametros.some((valor) => !Number.isSafeInteger(valor) || valor <= 0)
    ) {
      return false;
    }
    const [N, r, p] = parametros;
    if (N > 131072 || r > 16 || p > 4 || expected.length !== 64) return false;
    actual = crypto.scryptSync(contrasena, salt, expected.length, {
      N,
      r,
      p,
      maxmem: 128 * 1024 * 1024,
    });
  } else if (algoritmo.startsWith("pbkdf2:sha256:")) {
    const iterations = Number(algoritmo.slice("pbkdf2:sha256:".length));
    if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > 2000000) {
      return false;
    }
    actual = crypto.pbkdf2Sync(contrasena, salt, iterations, expected.length, "sha256");
  } else {
    return false;
  }

  return crypto.timingSafeEqual(actual, expected);
};

module.exports = { generarHashContrasena, verificarHashContrasena };
