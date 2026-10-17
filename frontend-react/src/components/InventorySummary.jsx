function InventorySummary({
  totalProductos,
  unidadesInventario,
  productosAgotados,
  productosStockBajo,
  umbralStockBajo,
  inventarioDisponible,
}) {
  const total = inventarioDisponible ? totalProductos : "—";
  const unidades = inventarioDisponible ? unidadesInventario : "—";
  const agotados = inventarioDisponible ? productosAgotados : "—";
  const stockBajo = inventarioDisponible ? productosStockBajo : "—";

  return (
    <section className="resumen-inventario" aria-label="Resumen del inventario">
      <article className="indicador">
        <span className="indicador-icono" aria-hidden="true">▦</span>
        <div>
          <p>Productos registrados</p>
          <strong>{total}</strong>
        </div>
      </article>
      <article className="indicador">
        <span className="indicador-icono indicador-verde" aria-hidden="true">↗</span>
        <div>
          <p>Unidades disponibles</p>
          <strong>{unidades}</strong>
        </div>
      </article>
      <article className="indicador">
        <span className="indicador-icono indicador-naranja" aria-hidden="true">!</span>
        <div>
          <p>Productos agotados</p>
          <strong>{agotados}</strong>
        </div>
      </article>
      <article className="indicador">
        <span className="indicador-icono indicador-bajo" aria-hidden="true">↓</span>
        <div>
          <p>Existencias bajas (≤ {umbralStockBajo})</p>
          <strong>{stockBajo}</strong>
        </div>
      </article>
    </section>
  );
}

export default InventorySummary;
