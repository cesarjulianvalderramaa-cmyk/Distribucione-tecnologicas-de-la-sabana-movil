const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const validarImagenProducto = (imagen) => {
  if (imagen === undefined || imagen === null || imagen === "") {
    return { value: null };
  }
  if (typeof imagen !== "string") {
    return { error: "La imagen debe ser un archivo JPG, PNG o WebP válido." };
  }

  const coincidencia = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(imagen);
  if (!coincidencia || !IMAGE_TYPES.has(coincidencia[1])) {
    return { error: "La imagen debe ser un archivo JPG, PNG o WebP válido." };
  }

  const [, tipo, base64] = coincidencia;
  const bytes = Buffer.from(base64, "base64");
  if (
    bytes.length === 0 ||
    bytes.length > MAX_IMAGE_BYTES ||
    bytes.toString("base64") !== base64
  ) {
    return { error: "La imagen no puede superar 2 MB y debe ser válida." };
  }

  const esJpeg =
    tipo === "image/jpeg" &&
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  const esPng =
    tipo === "image/png" &&
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const esWebp =
    tipo === "image/webp" &&
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";

  if (!esJpeg && !esPng && !esWebp) {
    return { error: "El contenido no coincide con el tipo de imagen seleccionado." };
  }
  return { value: imagen };
};

const validarDatosProducto = (datos) => {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return { error: "Debes enviar los datos del producto en formato JSON." };
  }
  const { nombre, precio, stock, id_categoria: idCategoria } = datos;
  if (typeof nombre !== "string" || !nombre.trim()) {
    return { error: "El nombre del producto es obligatorio." };
  }
  if (nombre.trim().length > 100) {
    return { error: "El nombre del producto no puede superar 100 caracteres." };
  }
  if (typeof precio !== "number" || !Number.isFinite(precio) || precio <= 0) {
    return { error: "El precio debe ser un número mayor que 0." };
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return { error: "El stock debe ser un número entero igual o mayor que 0." };
  }
  if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
    return { error: "El ID de categoría debe ser un entero mayor que 0." };
  }

  const imagenIncluida = Object.hasOwn(datos, "imagen");
  const imagen = imagenIncluida
    ? validarImagenProducto(datos.imagen)
    : { value: undefined };
  if (imagen.error) return imagen;
  return {
    values: [nombre.trim(), precio, stock, idCategoria],
    imagen: imagen.value,
    imagenIncluida,
  };
};

const validarIdProducto = (id) => {
  const idProducto = Number(id);
  return Number.isSafeInteger(idProducto) && idProducto > 0
    ? { value: idProducto }
    : { error: "El ID del producto debe ser mayor que 0." };
};

module.exports = { validarDatosProducto, validarIdProducto, validarImagenProducto };
