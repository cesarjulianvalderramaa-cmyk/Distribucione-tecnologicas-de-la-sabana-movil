const cors = require("cors");
const express = require("express");
const session = require("express-session");
const config = require("./config");
const authRoutes = require("./routes/auth");
const inventoryRoutes = require("./routes/inventory");

const app = express();

app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: "3mb" }));
app.use(session(config.session));
app.use("/api/auth", authRoutes);
app.use("/api", inventoryRoutes);

app.use((error, _req, res, _next) => {
  console.error("Error al procesar la solicitud:", error);
  const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 500;
  return res.status(status).json({
    error: status === 400 ? "La solicitud JSON no es válida." : "Error interno del servidor.",
  });
});

module.exports = app;
