require("dotenv").config();

const SESSION_DURATION = 8 * 60 * 60 * 1000;

if (!process.env.SESSION_SECRET) {
  throw new Error("Configura SESSION_SECRET antes de iniciar la API.");
}

const sameSiteSetting = (process.env.SESSION_COOKIE_SAMESITE || "Lax").toLowerCase();
const sameSite = ["lax", "strict", "none"].includes(sameSiteSetting)
  ? sameSiteSetting
  : "lax";

module.exports = {
  port: Number(process.env.PORT || 5000),
  session: {
    name: "inventario.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite,
      secure: ["1", "true", "yes"].includes(
        (process.env.SESSION_COOKIE_SECURE || "").toLowerCase()
      ),
      maxAge: SESSION_DURATION,
    },
  },
  corsOrigins: (process.env.CORS_ALLOWED_ORIGINS ||
    "http://127.0.0.1:5173,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
