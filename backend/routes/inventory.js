const express = require("express");
const { pool, asegurarColumnaImagen } = require("../database");
const { requiereInicioSesion } = require("../middleware/auth");
const {
  validarDatosProducto,
  validarIdProducto,
} = require("../validators/product");

const router = express.Router();
router.use(requiereInicioSesion);

router.get("/productos", async (_req, res) => {
  try {
    await asegurarColumnaImagen();
    const [rows] = await pool.execute(`
      SELECT id_producto, nombre, precio, stock, id_categoria, imagen
      FROM Producto
    `);
    return res.json(rows);
  } catch (error) {
    console.error("No se pudieron consultar los productos:", error);
    return res.status(500).json({ error: "No se pudieron consultar los productos." });
  }
});

router.get("/productos/:id", async (req, res) => {
  const validacion = validarIdProducto(req.params.id);
  if (validacion.error) return res.status(400).json({ error: validacion.error });

  try {
    await asegurarColumnaImagen();
    const [rows] = await pool.execute(
      `SELECT id_producto, nombre, precio, stock, id_categoria, imagen
       FROM Producto
       WHERE id_producto = ?`,
      [validacion.value]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    return res.json(rows[0]);
  } catch (error) {
    console.error(`No se pudo consultar el producto ${validacion.value}:`, error);
    return res.status(500).json({ error: "No se pudo consultar el producto." });
  }
});

router.get("/categorias", async (_req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT DISTINCT id_categoria
      FROM Producto
      WHERE id_categoria IS NOT NULL
      ORDER BY id_categoria
    `);
    return res.json(rows);
  } catch (error) {
    console.error("No se pudieron consultar las categorías:", error);
    return res.status(500).json({ error: "No se pudieron consultar las categorías." });
  }
});

router.get("/inventario/resumen", async (_req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        COUNT(*) AS total_productos,
        COALESCE(SUM(stock), 0) AS unidades_disponibles,
        COALESCE(SUM(stock = 0), 0) AS productos_agotados,
        COALESCE(SUM(stock BETWEEN 1 AND 5), 0) AS productos_stock_bajo
      FROM Producto
    `);
    return res.json(rows[0]);
  } catch (error) {
    console.error("No se pudo consultar el resumen del inventario:", error);
    return res.status(500).json({ error: "No se pudo consultar el resumen del inventario." });
  }
});

router.post("/productos", async (req, res) => {
  const resultado = validarDatosProducto(req.body);
  if (resultado.error) return res.status(400).json({ error: resultado.error });

  try {
    await asegurarColumnaImagen();
    const [result] = await pool.execute(
      `INSERT INTO Producto (nombre, precio, stock, id_categoria, imagen)
       VALUES (?, ?, ?, ?, ?)`,
      [...resultado.values, resultado.imagen ?? null]
    );
    return res.status(201).json({
      mensaje: "Producto creado correctamente.",
      id_producto: result.insertId,
    });
  } catch (error) {
    console.error("No se pudo crear el producto:", error);
    return res.status(500).json({ error: "No se pudo crear el producto." });
  }
});

router.put("/productos/:id", async (req, res) => {
  const validacionId = validarIdProducto(req.params.id);
  if (validacionId.error) {
    return res.status(400).json({ error: validacionId.error });
  }
  const resultado = validarDatosProducto(req.body);
  if (resultado.error) return res.status(400).json({ error: resultado.error });

  try {
    await asegurarColumnaImagen();
    const [result] = await pool.execute(
      `UPDATE Producto
       SET nombre = ?, precio = ?, stock = ?, id_categoria = ?,
           imagen = IF(?, ?, imagen)
       WHERE id_producto = ?`,
      [
        ...resultado.values,
        resultado.imagenIncluida,
        resultado.imagen ?? null,
        validacionId.value,
      ]
    );
    if (result.affectedRows === 0) {
      const [rows] = await pool.execute(
        "SELECT 1 FROM Producto WHERE id_producto = ?",
        [validacionId.value]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado." });
      }
    }
    return res.json({ mensaje: "Producto actualizado correctamente." });
  } catch (error) {
    console.error(`No se pudo actualizar el producto ${validacionId.value}:`, error);
    return res.status(500).json({ error: "No se pudo actualizar el producto." });
  }
});

router.delete("/productos/:id", async (req, res) => {
  const validacion = validarIdProducto(req.params.id);
  if (validacion.error) return res.status(400).json({ error: validacion.error });

  try {
    const [result] = await pool.execute(
      "DELETE FROM Producto WHERE id_producto = ?",
      [validacion.value]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    return res.json({ mensaje: "Producto eliminado correctamente." });
  } catch (error) {
    console.error(`No se pudo eliminar el producto ${validacion.value}:`, error);
    return res.status(500).json({ error: "No se pudo eliminar el producto." });
  }
});

module.exports = router;
