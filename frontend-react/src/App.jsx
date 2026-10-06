import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:5000/api/productos";

function App() {
  // ================================
  // ESTADOS
  // ================================

  const [productos, setProductos] = useState([]);

  const [formulario, setFormulario] = useState({
    nombre: "",
    precio: "",
    stock: "",
    id_categoria: "",
  });

  const [editando, setEditando] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState([]);

  // ================================
  // CARGAR PRODUCTOS DESDE LA API
  // ================================

  const cargarProductos = async () => {
    try {
      const respuesta = await fetch(API_URL);

      if (!respuesta.ok) {
        throw new Error("No se pudieron consultar los productos");
      }

      const datos = await respuesta.json();

      setProductos(datos);
      setError("");
    } catch (error) {
      console.error(error);
      setError("No fue posible conectar con la API.");
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // ================================
  // CAMBIAR DATOS DEL FORMULARIO
  // ================================

  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  // ================================
  // LIMPIAR FORMULARIO
  // ================================

  const limpiarFormulario = () => {
    setFormulario({
      nombre: "",
      precio: "",
      stock: "",
      id_categoria: "",
    });

    setEditando(null);
  };

  // ================================
  // CREAR / ACTUALIZAR PRODUCTO
  // ================================

  const manejarSubmit = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    // VALIDACIONES

    if (!formulario.nombre.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }

    if (Number(formulario.precio) <= 0) {
      setError("El precio debe ser mayor que 0.");
      return;
    }

    if (Number(formulario.stock) < 0) {
      setError("El stock no puede ser negativo.");
      return;
    }

    if (!formulario.id_categoria) {
      setError("Debe ingresar una categoría.");
      return;
    }

    const datos = {
      nombre: formulario.nombre.trim(),
      precio: Number(formulario.precio),
      stock: Number(formulario.stock),
      id_categoria: Number(formulario.id_categoria),
    };

    try {
      let respuesta;

      // ACTUALIZAR
      if (editando) {
        respuesta = await fetch(`${API_URL}/${editando}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });
      }

      // CREAR
      else {
        respuesta = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });
      }

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || "Error en la operación"
        );
      }

      if (editando) {
        setMensaje("Producto actualizado correctamente.");
      } else {
        setMensaje("Producto creado correctamente.");
      }

      limpiarFormulario();

      await cargarProductos();

      // Llevar al usuario al catálogo
      setTimeout(() => {
        document
          .getElementById("productos")
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 100);
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  // ================================
  // EDITAR PRODUCTO
  // ================================

  const editarProducto = (producto) => {
    setEditando(producto.id_producto);

    setFormulario({
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      id_categoria: producto.id_categoria,
    });

    setMensaje("");
    setError("");

    document
      .getElementById("administracion")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  // ================================
  // ELIMINAR PRODUCTO
  // ================================

  const eliminarProducto = async (id) => {
    const confirmar = window.confirm(
      "¿Está seguro de eliminar este producto?"
    );

    if (!confirmar) {
      return;
    }

    try {
      const respuesta = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo eliminar el producto"
        );
      }

      setMensaje(
        "Producto eliminado correctamente."
      );

      await cargarProductos();
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  // ================================
  // AGREGAR AL CARRITO
  // ================================

  const agregarCarrito = (producto) => {
    setCarrito((carritoActual) => [
      ...carritoActual,
      producto,
    ]);

    setMensaje(
      `${producto.nombre} agregado al carrito.`
    );
  };

  // ================================
  // BUSCADOR
  // ================================

  const productosFiltrados = productos.filter(
    (producto) =>
      producto.nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase())
  );

  // ================================
  // FORMATO DEL PRECIO
  // ================================

  const formatoPrecio = (precio) => {
    return Number(precio).toLocaleString("es-CO");
  };

  // ================================
  // IMAGEN DEL PRODUCTO
  // ================================

  const obtenerImagen = (nombre) => {
    const nombreProducto =
      nombre.toLowerCase();

    
     if (nombreProducto.includes("mouse gamer")) {
      return "/images/mousegamer.jpg";
    } 
    if (nombreProducto.includes("mouse")) {
      return "/images/mouse.jpg";
    }

    if (nombreProducto.includes("teclado")) {
      return "/images/teclado.jpg";
    }

    if (nombreProducto.includes("monitor")) {
      return "/images/monitor.jpg";
    }

    if (nombreProducto.includes("laptop")) {
      return "/images/laptop.jpg";
    }

    return null;
  };

  // ================================
  // ICONO DEL PRODUCTO
  // ================================

  const obtenerIcono = (nombre) => {
    const nombreProducto =
      nombre.toLowerCase();

    if (nombreProducto.includes("mouse")) {
      return "🖱️";
    }

    if (nombreProducto.includes("teclado")) {
      return "⌨️";
    }

    if (nombreProducto.includes("monitor")) {
      return "🖥️";
    }

    if (nombreProducto.includes("laptop")) {
      return "💻";
    }

    return "📦";
  };

  // ================================
  // INTERFAZ
  // ================================

  return (
    <div className="tienda">

      {/* =================================
          ENCABEZADO
      ================================= */}

      <header className="encabezado">

        <div className="logo">
          Distribuciones{" "}
          <span>de la Sabana</span>
        </div>

        <nav className="menu">
          <button
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >
            Inicio
          </button>

          <button
            onClick={() =>
              document
                .getElementById("productos")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            Productos
          </button>

          <button
            onClick={() =>
              document
                .getElementById("administracion")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            Administración
          </button>
        </nav>

        <button
          className="carrito"
          onClick={() => {
            if (carrito.length === 0) {
              setMensaje(
                "El carrito está vacío."
              );
            } else {
              setMensaje(
                `Tienes ${carrito.length} producto(s) en el carrito.`
              );
            }
          }}
        >
          🛒 Carrito ({carrito.length})
        </button>

      </header>

      {/* =================================
          HERO
      ================================= */}

      <section className="hero">

        <div className="hero-texto">

          <p className="hero-etiqueta">
            TECNOLOGÍA Y SOLUCIONES
          </p>

          <h1>
            Tecnología para
            <br />
            la Sabana
          </h1>

          <p>
            Encuentra computadores, accesorios,
            periféricos y productos tecnológicos
            para tus necesidades.
          </p>

          <button
            className="boton-hero"
            onClick={() =>
              document
                .getElementById("productos")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            Ver productos →
          </button>

        </div>

        <div className="hero-producto">

          <div className="hero-circulo">
            💻
          </div>

        </div>

      </section>

      {/* =================================
          CONTENIDO
      ================================= */}

      <main className="contenido">

        {/* TÍTULO */}

        <div className="encabezado-productos">

          <div>
            <p className="subtitulo">
              CATÁLOGO
            </p>

            <h2 className="titulo-seccion">
              Nuestros productos
            </h2>
          </div>

          <p className="contador-productos">
            {productos.length} producto(s)
          </p>

        </div>

        {/* =================================
            BUSCADOR
        ================================= */}

        <div className="contenedor-buscador">

          <span>🔎</span>

          <input
            className="buscador"
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
          />

          {busqueda && (
            <button
              className="limpiar-busqueda"
              onClick={() => setBusqueda("")}
            >
              ✕
            </button>
          )}

        </div>

        {/* =================================
            CATEGORÍAS
        ================================= */}

        <div className="categorias">

          <button
            className="categoria activa"
            onClick={() =>
              setBusqueda("")
            }
          >
            Todos
          </button>

          <button
            className="categoria"
            onClick={() =>
              setBusqueda("mouse")
            }
          >
            🖱️ Accesorios
          </button>

          <button
            className="categoria"
            onClick={() =>
              setBusqueda("teclado")
            }
          >
            ⌨️ Periféricos
          </button>

          <button
            className="categoria"
            onClick={() =>
              setBusqueda("monitor")
            }
          >
            🖥️ Monitores
          </button>

          <button
            className="categoria"
            onClick={() =>
              setBusqueda("laptop")
            }
          >
            💻 Computadores
          </button>

        </div>

        {/* =================================
            MENSAJES
        ================================= */}

        {mensaje && (
          <div className="mensaje">
            ✓ {mensaje}
          </div>
        )}

        {error && (
          <div className="error">
            ⚠️ {error}
          </div>
        )}

        {/* =================================
            PRODUCTOS
        ================================= */}

        <section
          id="productos"
          className="productos"
        >

          {productosFiltrados.length === 0 ? (

            <div className="sin-productos">
              <div>📦</div>

              <h3>
                No encontramos productos
              </h3>

              <p>
                Intenta con otro término de búsqueda.
              </p>

              <button
                className="boton-principal"
                onClick={() =>
                  setBusqueda("")
                }
              >
                Ver todos los productos
              </button>
            </div>

          ) : (

            productosFiltrados.map(
              (producto) => {

                const imagen =
                  obtenerImagen(
                    producto.nombre
                  );

                return (
                  <article
                    className="producto"
                    key={
                      producto.id_producto
                    }
                  >

                    {/* IMAGEN */}

                    <div className="producto-imagen">

                      {imagen ? (

                        <img
                          src={imagen}
                          alt={
                            producto.nombre
                          }
                        />

                      ) : (

                        <div className="icono-producto">
                          {obtenerIcono(
                            producto.nombre
                          )}
                        </div>

                      )}

                    </div>

                    {/* INFORMACIÓN */}

                    <div className="producto-info">

                      <div className="producto-categoria">
                        Tecnología
                      </div>

                      <h3>
                        {producto.nombre}
                      </h3>

                      <div className="precio">
                        $
                        {formatoPrecio(
                          producto.precio
                        )}
                      </div>

                      <div className="stock">
                        <span className="punto-stock">
                          ●
                        </span>

                        Stock disponible:{" "}
                        {producto.stock}
                      </div>

                      <button
                        className="boton-producto"
                        onClick={() =>
                          agregarCarrito(
                            producto
                          )
                        }
                      >
                        🛒 Agregar al carrito
                      </button>

                      {/* ACCIONES ADMINISTRATIVAS */}

                      <div className="acciones-producto">

                        <button
                          className="boton-editar"
                          onClick={() =>
                            editarProducto(
                              producto
                            )
                          }
                        >
                          ✏️ Editar
                        </button>

                        <button
                          className="boton-eliminar"
                          onClick={() =>
                            eliminarProducto(
                              producto.id_producto
                            )
                          }
                        >
                          🗑️ Eliminar
                        </button>

                      </div>

                    </div>

                  </article>
                );
              }
            )

          )}

        </section>

        {/* =================================
            ADMINISTRACIÓN
        ================================= */}

        <section
          id="administracion"
          className="administracion"
        >

          <div className="administracion-titulo">

            <div>
              <p className="subtitulo">
                PANEL DE GESTIÓN
              </p>

              <h2>
                Administración de productos
              </h2>

              <p>
                Crea y actualiza los productos
                almacenados en la base de datos.
              </p>
            </div>

            <div className="icono-admin">
              ⚙️
            </div>

          </div>

          {/* FORMULARIO */}

          <form
            className="formulario"
            onSubmit={manejarSubmit}
          >

            <div className="campo">

              <label>
                Nombre del producto
              </label>

              <input
                type="text"
                name="nombre"
                placeholder="Ej. Mouse Logitech"
                value={
                  formulario.nombre
                }
                onChange={
                  manejarCambio
                }
              />

            </div>

            <div className="campo">

              <label>
                Precio
              </label>

              <input
                type="number"
                name="precio"
                placeholder="Ej. 85000"
                value={
                  formulario.precio
                }
                onChange={
                  manejarCambio
                }
              />

            </div>

            <div className="campo">

              <label>
                Stock
              </label>

              <input
                type="number"
                name="stock"
                placeholder="Ej. 20"
                value={
                  formulario.stock
                }
                onChange={
                  manejarCambio
                }
              />

            </div>

            <div className="campo">

              <label>
                ID de categoría
              </label>

              <input
                type="number"
                name="id_categoria"
                placeholder="Ej. 1"
                value={
                  formulario.id_categoria
                }
                onChange={
                  manejarCambio
                }
              />

            </div>

            <div className="botones-formulario">

              <button
                className="boton-principal"
                type="submit"
              >
                {editando
                  ? "✓ Actualizar producto"
                  : "+ Crear producto"}
              </button>

              {editando && (

                <button
                  className="boton-cancelar"
                  type="button"
                  onClick={
                    limpiarFormulario
                  }
                >
                  Cancelar
                </button>

              )}

            </div>

          </form>

        </section>

      </main>

      {/* =================================
          PIE DE PÁGINA
      ================================= */}

      <footer className="footer">

        <div className="logo">
          Distribuciones{" "}
          <span>de la Sabana</span>
        </div>

        <p>
          Tecnología, calidad y servicio.
        </p>

        <p>
          © 2026 Distribuciones de la Sabana
        </p>

      </footer>

    </div>
  );
}

export default App;