function ProductForm({ formulario, manejarCambio, manejarSubmit, editando, guardando, limpiarFormulario }) {
  return (
    <section className="administracion" id="administracion">
      <div className="administracion-titulo">
        <div>
          <p className="subtitulo">PANEL DE GESTIÓN</p>
          <h2>Administración de productos</h2>
          <p>
            Crea y actualiza los productos
            almacenados en la base de datos.
          </p>
        </div>
        <div className="icono-admin">⚙️</div>
      </div>

      <form className="formulario" onSubmit={manejarSubmit}>
        <div className="campo">
          <label htmlFor="nombre">Nombre del producto</label>
          <input
            id="nombre"
            maxLength={100}
            name="nombre"
            onChange={manejarCambio}
            placeholder="Ej. Mouse Logitech"
            required
            type="text"
            value={formulario.nombre}
          />
        </div>
        <div className="campo">
          <label htmlFor="precio">Precio</label>
          <input
            id="precio"
            min="1"
            name="precio"
            onChange={manejarCambio}
            placeholder="Ej. 85000"
            required
            step="1"
            type="number"
            value={formulario.precio}
          />
        </div>
        <div className="campo">
          <label htmlFor="stock">Stock</label>
          <input
            id="stock"
            min="0"
            name="stock"
            onChange={manejarCambio}
            placeholder="Ej. 20"
            required
            step="1"
            type="number"
            value={formulario.stock}
          />
        </div>
        <div className="campo">
          <label htmlFor="id_categoria">ID de categoría</label>
          <input
            id="id_categoria"
            min="1"
            name="id_categoria"
            onChange={manejarCambio}
            placeholder="Ej. 1"
            required
            step="1"
            type="number"
            value={formulario.id_categoria}
          />
          <small>Ingresa el ID de una categoría existente.</small>
        </div>
        <div className="botones-formulario">
          <button className="boton-principal" disabled={guardando} type="submit">
            {guardando
              ? "Guardando..."
              : editando
                ? "✓ Actualizar producto"
                : "+ Crear producto"}
          </button>
          {editando && (
            <button
              className="boton-cancelar"
              onClick={limpiarFormulario}
              type="button"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default ProductForm;
