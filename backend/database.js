const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database:
    process.env.MYSQL_DATABASE || "distribuciones_tecnologicas_sabana",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

let asegurarUsuariosPromise;
const asegurarTablaUsuarios = async () => {
  if (!asegurarUsuariosPromise) {
    asegurarUsuariosPromise = (async () => {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS Usuario (
          id_usuario INT AUTO_INCREMENT PRIMARY KEY,
          usuario VARCHAR(50) NOT NULL UNIQUE,
          correo VARCHAR(254) NOT NULL UNIQUE,
          contrasena_hash VARCHAR(255) NOT NULL,
          creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const [columns] = await pool.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'Usuario'
           AND COLUMN_NAME = 'correo'`
      );
      if (columns.length === 0) {
        await pool.execute(`
          ALTER TABLE Usuario
          ADD COLUMN correo VARCHAR(254) NULL,
          ADD UNIQUE KEY uq_usuario_correo (correo)
        `);
      }
    })().catch((error) => {
      asegurarUsuariosPromise = null;
      throw error;
    });
  }
  await asegurarUsuariosPromise;
};

let asegurarImagenPromise;
const asegurarColumnaImagen = async () => {
  if (!asegurarImagenPromise) {
    asegurarImagenPromise = (async () => {
      const [columns] = await pool.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'Producto'
           AND COLUMN_NAME = 'imagen'`
      );
      if (columns.length === 0) {
        await pool.execute("ALTER TABLE Producto ADD COLUMN imagen MEDIUMTEXT NULL");
      }
    })().catch((error) => {
      asegurarImagenPromise = null;
      throw error;
    });
  }
  await asegurarImagenPromise;
};

module.exports = { pool, asegurarTablaUsuarios, asegurarColumnaImagen };
