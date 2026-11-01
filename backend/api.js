const app = require("./app");
const { port } = require("./config");
const { generarHashContrasena, verificarHashContrasena } = require("./services/password");
const { normalizarCorreo } = require("./validators/email");
const {
  validarDatosProducto,
  validarImagenProducto,
} = require("./validators/product");

if (require.main === module) {
  app.listen(port, "127.0.0.1", () => {
    console.log(`API lista en http://127.0.0.1:${port}`);
  });
}

module.exports = {
  app,
  generarHashContrasena,
  normalizarCorreo,
  validarImagenProducto,
  validarDatosProducto,
  verificarHashContrasena,
};
