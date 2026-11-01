const express = require("express");
const { pool, asegurarTablaUsuarios } = require("../database");
const { requiereInicioSesion } = require("../middleware/auth");
const { generarHashContrasena, verificarHashContrasena } = require("../services/password");
const { normalizarCorreo } = require("../validators/email");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { usuario: identificador, contrasena } = req.body || {};
  if (
    typeof identificador !== "string" ||
    !identificador.trim() ||
    typeof contrasena !== "string" ||
    !contrasena.trim()
  ) {
    return res.status(400).json({
      error: "Debes enviar usuario o correo electrónico y contraseña.",
    });
  }

  try {
    await asegurarTablaUsuarios();
    const [rows] = await pool.execute(
      `SELECT id_usuario, usuario, contrasena_hash
       FROM Usuario
       WHERE usuario = ? OR correo = ?`,
      [identificador.trim().toLowerCase(), identificador.trim().toLowerCase()]
    );
    const registro = rows[0];
    if (!registro || !verificarHashContrasena(contrasena, registro.contrasena_hash)) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }

    if (!registro.contrasena_hash.startsWith("scrypt:")) {
      await pool.execute(
        "UPDATE Usuario SET contrasena_hash = ? WHERE id_usuario = ?",
        [generarHashContrasena(contrasena), registro.id_usuario]
      );
    }
    req.session.usuario_id = registro.id_usuario;
    req.session.usuario = registro.usuario;
    return res.json({ usuario: registro.usuario });
  } catch (error) {
    console.error("No se pudo iniciar la sesión:", error);
    return res.status(500).json({ error: "No se pudo validar el usuario." });
  }
});

router.post("/register", async (req, res) => {
  const { usuario, correo, contrasena } = req.body || {};
  if (
    typeof usuario !== "string" ||
    !usuario.trim() ||
    typeof correo !== "string" ||
    !correo.trim() ||
    typeof contrasena !== "string" ||
    !contrasena.trim()
  ) {
    return res.status(400).json({
      error: "Debes enviar usuario, correo electrónico y contraseña.",
    });
  }

  const nombreUsuario = usuario.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,50}$/.test(nombreUsuario)) {
    return res.status(400).json({
      error:
        "El usuario debe tener entre 3 y 50 caracteres: letras, números, punto, guion o guion bajo.",
    });
  }

  let correoNormalizado;
  try {
    correoNormalizado = normalizarCorreo(correo);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  if (contrasena.length < 12 || contrasena.length > 128) {
    return res.status(400).json({
      error: "La contraseña debe tener entre 12 y 128 caracteres.",
    });
  }

  try {
    await asegurarTablaUsuarios();
    const [result] = await pool.execute(
      `INSERT INTO Usuario (usuario, correo, contrasena_hash)
       VALUES (?, ?, ?)`,
      [nombreUsuario, correoNormalizado, generarHashContrasena(contrasena)]
    );
    req.session.usuario_id = result.insertId;
    req.session.usuario = nombreUsuario;
    return res.status(201).json({ usuario: nombreUsuario });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Ese nombre de usuario o correo electrónico ya está registrado.",
      });
    }
    console.error("No se pudo registrar la cuenta:", error);
    return res.status(500).json({ error: "No se pudo registrar la cuenta." });
  }
});

router.get("/me", requiereInicioSesion, (req, res) => {
  res.json({ usuario: req.session.usuario });
});

router.post("/logout", requiereInicioSesion, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("inventario.sid");
    return res.json({ mensaje: "Sesión cerrada correctamente." });
  });
});

module.exports = router;
