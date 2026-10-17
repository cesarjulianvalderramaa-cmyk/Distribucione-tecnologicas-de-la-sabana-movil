function obtenerImagen(nombre) {
  const nombreProducto = nombre.toLowerCase();

  if (nombreProducto.includes("mouse gamer")) return "/images/mousegamer.jpg";
  if (nombreProducto.includes("mouse")) return "/images/mouse.jpg";

  return null;
}

function obtenerIcono(nombre) {
  const nombreProducto = nombre.toLowerCase();

  if (nombreProducto.includes("mouse")) return "🖱️";
  if (nombreProducto.includes("teclado")) return "⌨️";
  if (nombreProducto.includes("monitor")) return "🖥️";
  if (nombreProducto.includes("laptop")) return "💻";

  return "📦";
}

function ProductCard({ producto, umbralStockBajo, formatoPrecio, onEdit, onDelete }) {
  const stock = Number(producto.stock);
  const imagen = obtenerImagen(producto.nombre);
  const agotado = stock === 0;
  const stockBajo = stock > 0 && stock <= umbralStockBajo;

  return (
    <article className="producto">
      <div className="producto-imagen">
        {imagen ? (
          <img src={imagen} alt={producto.nombre} />
        ) : (
          <div className="icono-producto" aria-hidden="true">
            {obtenerIcono(producto.nombre)}
          </div>
        )}
      </div>

      <div className="producto-info">
        <div className="producto-identificadores">
          <span className="producto-codigo">Código #{producto.id_producto}</span>
          <span className="producto-categoria">
            Categoría #{producto.id_categoria}
          </span>
        </div>

        <h3>{producto.nombre}</h3>
        <div className="precio">{formatoPrecio(producto.precio)}</div>

        <div
          className={`stock ${agotado ? "stock-agotado" : stockBajo ? "stock-bajo" : ""}`}
        >
          <span className="punto-stock" aria-hidden="true">●</span>
          {agotado
            ? "Agotado"
            : `${stock} ${stock === 1 ? "unidad disponible" : "unidades disponibles"}`}
          {stockBajo && <strong className="aviso-stock-bajo">Stock bajo</strong>}
        </div>

        <div className="acciones-producto">
          <button
            className="boton-editar"
            onClick={() => onEdit(producto)}
            type="button"
          >
            ✏️ Editar
          </button>
          <button
            className="boton-eliminar"
            onClick={() => onDelete(producto.id_producto)}
            type="button"
          >
            🗑️ Eliminar
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
