const test = require("node:test");
const assert = require("node:assert/strict");

process.env.SESSION_SECRET = "clave-de-prueba-suficientemente-larga";
const {
  generarHashContrasena,
  normalizarCorreo,
  validarImagenProducto,
  validarDatosProducto,
  verificarHashContrasena,
} = require("../backend/api");
const { validarIdProducto } = require("../backend/validators/product");

test("normaliza correo válido y rechaza formatos inválidos", () => {
  assert.equal(normalizarCorreo(" Persona@Correo.COM "), "persona@correo.com");
  assert.throws(() => normalizarCorreo("correo-invalido"), /correo electrónico válido/);
});

test("valida y normaliza los datos del producto", () => {
  assert.deepEqual(
    validarDatosProducto({
      nombre: " Mouse ",
      precio: 85000,
      stock: 10,
      id_categoria: 1,
    }),
    {
      values: ["Mouse", 85000, 10, 1],
      imagen: undefined,
      imagenIncluida: false,
    }
  );
  assert.match(
    validarDatosProducto({
      nombre: "Mouse",
      precio: 0,
      stock: 10,
      id_categoria: 1,
    }).error,
    /precio/
  );
});

test("acepta imágenes PNG válidas y rechaza contenido que no coincide", () => {
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const imagen = `data:image/png;base64,${png.toString("base64")}`;

  assert.deepEqual(validarImagenProducto(imagen), { value: imagen });
  assert.match(
    validarImagenProducto(`data:image/png;base64,${Buffer.from("not png").toString("base64")}`).error,
    /no coincide/
  );
  assert.match(validarImagenProducto("data:image/svg+xml;base64,AA==").error, /JPG, PNG o WebP/);
});

test("valida IDs de producto positivos y seguros", () => {
  assert.deepEqual(validarIdProducto("42"), { value: 42 });
  assert.match(validarIdProducto("0").error, /mayor que 0/);
  assert.match(validarIdProducto("1.5").error, /mayor que 0/);
  assert.match(validarIdProducto("9007199254740992").error, /mayor que 0/);
});

test("crea hashes compatibles con la verificación y no acepta otra contraseña", () => {
  const hash = generarHashContrasena("contrasena-segura-123");
  assert.match(hash, /^scrypt:32768:8:1\$/);
  assert.equal(verificarHashContrasena("contrasena-segura-123", hash), true);
  assert.equal(verificarHashContrasena("otra-contrasena", hash), false);
});

test("requiere sesión antes de permitir consultar datos protegidos", async () => {
  const { app } = require("../backend/api");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));

  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    for (const path of [
      "/api/productos",
      "/api/productos/1",
      "/api/categorias",
      "/api/inventario/resumen",
    ]) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 401, path);
      assert.deepEqual(await response.json(), {
        error: "Debes iniciar sesión para continuar.",
      });
    }
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
