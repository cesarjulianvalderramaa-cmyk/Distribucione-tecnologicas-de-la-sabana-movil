const requiereInicioSesion = (req, res, next) => {
  if (!req.session.usuario_id) {
    return res.status(401).json({ error: "Debes iniciar sesión para continuar." });
  }
  return next();
};

module.exports = { requiereInicioSesion };
