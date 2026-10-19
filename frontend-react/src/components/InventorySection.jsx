import InventorySummary from "./InventorySummary.jsx";
import ProductCard from "./ProductCard.jsx";

function InventorySection({
  modoDemo,
  productos,
  unidadesInventario,
  productosAgotados,
  productosStockBajo,
  umbralStockBajo,
  error,
  cargando,
  productosFiltrados,
  categorias,
  filtroStock,
  setFiltroStock,
  filtroCategoria,
  setFiltroCategoria,
  busqueda,
  setBusqueda,
  mensaje,
  setCargando,
  cargarProductos,
  formatoPrecio,
  editarProducto,
  eliminarProducto,
  descargarReporte,
}) {
  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroStock("todos");
    setFiltroCategoria("todas");
  };

  return (
    <>
      {modoDemo && (
        <div className="banner-demostracion" role="status">
          <strong>MODO DEMOSTRACIÓN · DATOS FICTICIOS</strong>
          <span>Los registros y cambios de esta sesión no se envían ni se guardan en el backend.</span>
        </div>
      )}

      <InventorySummary
        totalProductos={productos.length}
        unidadesInventario={unidadesInventario}
        productosAgotados={productosAgotados}
        productosStockBajo={productosStockBajo}
        umbralStockBajo={umbralStockBajo}
        inventarioDisponible={modoDemo || !(error && productos.length === 0)}
      />

      <div className="encabezado-productos">
        <div>
          <p className="subtitulo">CATÁLOGO</p>
          <h2 className="titulo-seccion">Nuestros productos</h2>
          <button
            className="boton-reporte"
            disabled={productos.length === 0}
            onClick={descargarReporte}
            type="button"
          >
            Descargar reporte CSV
          </button>
        </div>
        <p className="contador-productos">
          {error && productos.length === 0
            ? "Inventario no disponible"
            : `${productosFiltrados.length} de ${productos.length} producto(s)`}
        </p>
      </div>

      <div className="contenedor-buscador">
        <span aria-hidden="true">⌕</span>
        <input
          aria-label="Buscar productos por nombre o código"
          className="buscador"
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o código..."
          type="text"
          value={busqueda}
        />
        {busqueda && (
          <button
            aria-label="Limpiar búsqueda"
            className="limpiar-busqueda"
            onClick={() => setBusqueda("")}
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      <div className="filtros-inventario">
        <div aria-label="Filtrar por disponibilidad" className="categorias">
          {[
            ["todos", "Todos"],
            ["disponibles", "Disponibles"],
            ["agotados", "Agotados"],
            ["bajos", "Existencias bajas"],
          ].map(([valor, etiqueta]) => (
            <button
              aria-pressed={filtroStock === valor}
              className={`categoria ${filtroStock === valor ? "activa" : ""}`}
              key={valor}
              onClick={() => setFiltroStock(valor)}
              type="button"
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <label className="filtro-categoria">
          <span>Categoría</span>
          <select
            aria-label="Filtrar por categoría"
            onChange={(e) => setFiltroCategoria(e.target.value)}
            value={filtroCategoria}
          >
            <option value="todas">Todas las categorías</option>
            {categorias.map((idCategoria) => (
              <option key={idCategoria} value={idCategoria}>
                Categoría #{idCategoria}
              </option>
            ))}
          </select>
        </label>
      </div>

      {mensaje && (
        <div aria-live="polite" className="mensaje" role="status">
          ✓ {mensaje}
        </div>
      )}
      {error && (
        <div className="error" role="alert">
          ⚠️ {error}
        </div>
      )}

      <section className="productos" id="productos">
        {cargando ? (
          <div className="sin-productos" role="status">
            <div>⏳</div>
            <h3>Cargando inventario...</h3>
            <p>Estamos consultando los productos registrados.</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="sin-productos">
            <div>{error ? "⚠️" : "📦"}</div>
            <h3>
              {error
                ? "No fue posible cargar el inventario"
                : "No encontramos productos"}
            </h3>
            <p>
              {error
                ? "Verifica que la API de Flask esté activa e inténtalo de nuevo."
                : "Intenta con otro término de búsqueda o limpia los filtros."}
            </p>
            <button
              className="boton-principal"
              onClick={() => {
                if (error) {
                  setCargando(true);
                  cargarProductos();
                } else {
                  limpiarFiltros();
                }
              }}
              type="button"
            >
              {error ? "Reintentar" : "Limpiar filtros"}
            </button>
          </div>
        ) : (
          productosFiltrados.map((producto) => (
            <ProductCard
              key={producto.id_producto}
              producto={producto}
              umbralStockBajo={umbralStockBajo}
              formatoPrecio={formatoPrecio}
              onEdit={editarProducto}
              onDelete={eliminarProducto}
            />
          ))
        )}
      </section>
    </>
  );
}

export default InventorySection;
