const normalizarCorreo = (correo) => {
  if (typeof correo !== "string") {
    throw new Error("El correo electrónico es obligatorio.");
  }

  const normalizado = correo.trim().toLowerCase();
  const [local, domain, ...extra] = normalizado.split("@");
  const emailPattern =
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

  if (
    normalizado.length > 254 ||
    !emailPattern.test(normalizado) ||
    extra.length > 0 ||
    local.length > 64 ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..") ||
    !domain
  ) {
    throw new Error("Ingresa un correo electrónico válido.");
  }

  return normalizado;
};

module.exports = { normalizarCorreo };
