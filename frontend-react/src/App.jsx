import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "/api/productos";
const AUTH_URL = API_URL.replace(/\/productos\/?$/, "/auth");

const solicitarApi = async (url, opciones) => {
  try {
    return await fetch(url, opciones);
  } catch (error) {
    throw new Error(
      "No se pudo conectar con Flask. Inicia la API con `python api.py` y vuelve a intentarlo.",
      { cause: error }
    );
  }
};

const leerRespuesta = async (respuesta) => {
  if ([502, 503, 504].includes(respuesta.status)) {
    throw new Error(
      "No se pudo conectar con Flask. Inicia la API con `python api.py` y vuelve a intentarlo."
    );
  }

  let datos;

  try {
    datos = await respuesta.json();
  } catch {
    throw new Error(
      `La API devolvió una respuesta no válida (HTTP ${respuesta.status}).`
    );
  }

  if (!respuesta.ok) {
    throw new Error(
      datos.error || `La API respondió con HTTP ${respuesta.status}.`
    );
  }

  return datos;
};

const obtenerProductos = async () => {
  const respuesta = await solicitarApi(API_URL, { credentials: "include" });
  return leerRespuesta(respuesta);
};

function App() {
  // ================================
  // ESTADOS
  // ================================

  const [productos, setProductos] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [comprobandoSesion, setComprobandoSesion] = useState(true);
  const [usuarioAcceso, setUsuarioAcceso] = useState("");
  const [contrasenaAcceso, setContrasenaAcceso] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [modoAcceso, setModoAcceso] = useState("login");
  const [errorAcceso, setErrorAcceso] = useState("");
  const [iniciandoSesion, setIniciandoSesion] = useState(false);

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
  const [filtroStock, setFiltroStock] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // ================================
  // CARGAR PRODUCTOS DESDE LA API
  // ================================

  const cargarProductos = async () => {
    try {
      setProductos(await obtenerProductos());
      setError("");
    } catch (error) {
      console.error(error);
      setError(error.message || "No fue posible conectar con la API.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let activo = true;

    const comprobarSesion = async () => {
      try {
        const respuesta = await solicitarApi(`${AUTH_URL}/me`, {
          credentials: "include",
        });
        if (respuesta.status === 401) return;
        const datos = await leerRespuesta(respuesta);
        if (activo) setUsuarioActual(datos.usuario);
      } catch (error) {
        if (activo) {
          console.error(error);
          setErrorAcceso(error.message || "No fue posible verificar la sesión.");
        }
      } finally {
        if (activo) setComprobandoSesion(false);
      }
    };

    comprobarSesion();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!usuarioActual) return undefined;

    let activo = true;
    const cargarInventario = async () => {
      try {
        setProductos(await obtenerProductos());
        if (activo) setError("");
      } catch (error) {
        if (activo) {
          console.error(error);
          setError(error.message || "No fue posible cargar el inventario.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarInventario();
    return () => {
      activo = false;
    };
  }, [usuarioActual]);

  const manejarAcceso = async (e) => {
    e.preventDefault();
    setErrorAcceso("");

    if (
      modoAcceso === "registro" &&
      contrasenaAcceso !== confirmarContrasena
    ) {
      setErrorAcceso("Las contraseñas no coinciden.");
      return;
    }

    setIniciandoSesion(true);

    try {
      const respuesta = await solicitarApi(
        `${AUTH_URL}/${modoAcceso === "registro" ? "register" : "login"}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario: usuarioAcceso,
            contrasena: contrasenaAcceso,
          }),
        }
      );
      const datos = await leerRespuesta(respuesta);
      setContrasenaAcceso("");
      setConfirmarContrasena("");
      setCargando(true);
      if (modoAcceso === "registro") {
        setMensaje("Cuenta creada correctamente. Bienvenido al inventario.");
      }
      setUsuarioActual(datos.usuario);
    } catch (error) {
      console.error(error);
      setErrorAcceso(error.message || "No fue posible iniciar sesión.");
    } finally {
      setIniciandoSesion(false);
    }
  };

  const manejarCierreSesion = async () => {
    setError("");
    try {
      const respuesta = await solicitarApi(`${AUTH_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      await leerRespuesta(respuesta);
      setProductos([]);
      setMensaje("");
      setModoAcceso("login");
      setContrasenaAcceso("");
      setConfirmarContrasena("");
      setUsuarioActual(null);
    } catch (error) {
      console.error(error);
      setError(error.message || "No fue posible cerrar la sesión.");
    }
  };

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

    const precio = Number(formulario.precio);
    const stock = Number(formulario.stock);
    const idCategoria = Number(formulario.id_categoria);

    if (!formulario.precio || !Number.isFinite(precio) || precio <= 0) {
      setError("El precio debe ser mayor que 0.");
      return;
    }

    if (
      formulario.stock === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError("El stock debe ser un número entero igual o mayor que 0.");
      return;
    }

    if (
      !formulario.id_categoria ||
      !Number.isInteger(idCategoria) ||
      idCategoria <= 0
    ) {
      setError("Debe ingresar un ID de categoría válido.");
      return;
    }

    const datos = {
      nombre: formulario.nombre.trim(),
      precio,
      stock,
      id_categoria: idCategoria,
    };

    setGuardando(true);

    try {
      let respuesta;

      // ACTUALIZAR
      if (editando) {
        respuesta = await solicitarApi(`${API_URL}/${editando}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });
      }

      // CREAR
      else {
        respuesta = await solicitarApi(API_URL, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        });
      }

      await leerRespuesta(respuesta);

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
    } finally {
      setGuardando(false);
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

    setMensaje("");
    setError("");

    try {
      const respuesta = await solicitarApi(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      await leerRespuesta(respuesta);

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
  // BUSCADOR
  // ================================

  const productosFiltrados = productos.filter(
    (producto) => {
      const coincideBusqueda = `${producto.nombre} ${producto.id_categoria}`
        .toLowerCase()
        .includes(busqueda.trim().toLowerCase());
      const coincideStock =
        filtroStock === "todos" ||
        (filtroStock === "disponibles" && Number(producto.stock) > 0) ||
        (filtroStock === "agotados" && Number(producto.stock) === 0);

      return coincideBusqueda && coincideStock;
    }
  );

  const unidadesInventario = productos.reduce(
    (total, producto) => total + Number(producto.stock),
    0
  );
  const productosAgotados = productos.filter(
    (producto) => Number(producto.stock) === 0
  ).length;

  // ================================
  // FORMATO DEL PRECIO
  // ================================

  const formatoPrecio = (precio) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(Number(precio));

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

  if (comprobandoSesion) {
    return (
      <main className="auth-shell">
        <div className="auth-card auth-cargando" role="status">
          <span className="auth-marca">DS</span>
          <p>Verificando tu sesión...</p>
        </div>
      </main>
    );
  }

  if (!usuarioActual) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-identidad">
            <span className="auth-marca">DS</span>
            <div>
              <strong>Distribuciones</strong>
              <span>de la Sabana</span>
            </div>
          </div>

          <p className="auth-etiqueta">SISTEMA DE INVENTARIO</p>
          <h1>{modoAcceso === "registro" ? "Crear cuenta" : "Iniciar sesión"}</h1>
          <p className="auth-descripcion">
            {modoAcceso === "registro"
              ? "Regístrate para acceder y administrar el inventario."
              : "Ingresa tus credenciales para administrar el inventario."}
          </p>

          {errorAcceso && (
            <div className="error auth-error" role="alert">
              ⚠️ {errorAcceso}
            </div>
          )}

          <form className="auth-formulario" onSubmit={manejarAcceso}>
            <div className="campo">
              <label htmlFor="usuario-acceso">Nombre de usuario</label>
              <input
                autoComplete="username"
                id="usuario-acceso"
                maxLength={50}
                minLength={3}
                name="usuario"
                onChange={(e) => setUsuarioAcceso(e.target.value)}
                pattern="[A-Za-z0-9._\-]+"
                placeholder="Ej. cesar.sabana"
                required
                value={usuarioAcceso}
              />
              {modoAcceso === "registro" && (
                <small>Usa de 3 a 50 letras, números, puntos, guiones o guion bajo.</small>
              )}
            </div>
            <div className="campo">
              <label htmlFor="contrasena-acceso">Contraseña</label>
              <input
                autoComplete={modoAcceso === "registro" ? "new-password" : "current-password"}
                id="contrasena-acceso"
                maxLength={128}
                name="contrasena"
                minLength={modoAcceso === "registro" ? 12 : undefined}
                onChange={(e) => setContrasenaAcceso(e.target.value)}
                placeholder={modoAcceso === "registro" ? "Mínimo 12 caracteres" : ""}
                required
                type="password"
                value={contrasenaAcceso}
              />
            </div>
            {modoAcceso === "registro" && (
              <div className="campo">
                <label htmlFor="confirmar-contrasena">Confirmar contraseña</label>
                <input
                  autoComplete="new-password"
                  id="confirmar-contrasena"
                  maxLength={128}
                  minLength={12}
                  name="confirmar-contrasena"
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  required
                  type="password"
                  value={confirmarContrasena}
                />
              </div>
            )}
            <button
              className="boton-principal auth-submit"
              disabled={iniciandoSesion}
              type="submit"
            >
              {iniciandoSesion
                ? modoAcceso === "registro"
                  ? "Creando cuenta..."
                  : "Validando..."
                : modoAcceso === "registro"
                  ? "Crear cuenta"
                  : "Ingresar"}
            </button>
          </form>
          <p className="auth-ayuda">
            {modoAcceso === "registro" ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"}{" "}
            <button
              className="auth-cambiar-modo"
              onClick={() => {
                setModoAcceso((modoActual) =>
                  modoActual === "registro" ? "login" : "registro"
                );
                setErrorAcceso("");
                setContrasenaAcceso("");
                setConfirmarContrasena("");
              }}
              type="button"
            >
              {modoAcceso === "registro" ? "Inicia sesión" : "Regístrate"}
            </button>
          </p>
        </section>
      </main>
    );
  }

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

        <div className="acciones-sesion">
          <span className="saludo-usuario">Hola, {usuarioActual}</span>
          <button
            className="boton-nuevo-producto"
            onClick={() =>
              document
                .getElementById("administracion")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            + Nuevo producto
          </button>
          <button className="boton-cerrar-sesion" onClick={manejarCierreSesion}>
            Cerrar sesión
          </button>
        </div>

      </header>

      {/* =================================
          HERO
      ================================= */}

      <section className="hero">

        <div className="hero-texto">

          <p className="hero-etiqueta">
          SISTEMA DE INVENTARIO
          </p>

          <h1>Gestiona el inventario de la Sabana</h1>

          <p>
            Administra el catálogo de productos de Distribuciones de la Sabana
            desde un solo lugar.
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
            Ver inventario →
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

        <section className="resumen-inventario" aria-label="Resumen del inventario">
          <article className="indicador">
            <span className="indicador-icono">▦</span>
            <div>
              <p>Productos registrados</p>
              <strong>{error && productos.length === 0 ? "—" : productos.length}</strong>
            </div>
          </article>
          <article className="indicador">
            <span className="indicador-icono indicador-verde">↗</span>
            <div>
              <p>Unidades disponibles</p>
              <strong>{error && productos.length === 0 ? "—" : unidadesInventario}</strong>
            </div>
          </article>
          <article className="indicador">
            <span className="indicador-icono indicador-naranja">!</span>
            <div>
              <p>Productos agotados</p>
              <strong>{error && productos.length === 0 ? "—" : productosAgotados}</strong>
            </div>
          </article>
        </section>

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
            {error && productos.length === 0
              ? "Inventario no disponible"
              : `${productosFiltrados.length} de ${productos.length} producto(s)`}
          </p>

        </div>

        {/* =================================
            BUSCADOR
        ================================= */}

        <div className="contenedor-buscador">

          <span aria-hidden="true">⌕</span>

          <input
            className="buscador"
            type="text"
            aria-label="Buscar productos por nombre o categoría"
            placeholder="Buscar por nombre o categoría..."
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
            FILTRAR POR STOCK
        ================================= */}

        <div className="categorias">

          <button
            className={`categoria ${filtroStock === "todos" ? "activa" : ""}`}
            aria-pressed={filtroStock === "todos"}
            onClick={() => setFiltroStock("todos")}
          >
            Todos
          </button>

          <button
            className={`categoria ${filtroStock === "disponibles" ? "activa" : ""}`}
            aria-pressed={filtroStock === "disponibles"}
            onClick={() => setFiltroStock("disponibles")}
          >
            Disponibles
          </button>

          <button
            className={`categoria ${filtroStock === "agotados" ? "activa" : ""}`}
            aria-pressed={filtroStock === "agotados"}
            onClick={() => setFiltroStock("agotados")}
          >
            Agotados
          </button>

        </div>

        {/* =================================
            MENSAJES
        ================================= */}

        {mensaje && (
          <div className="mensaje" role="status" aria-live="polite">
            ✓ {mensaje}
          </div>
        )}

        {error && (
          <div className="error" role="alert">
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
                    setBusqueda("");
                    setFiltroStock("todos");
                  }
                }}
              >
                {error ? "Reintentar" : "Limpiar filtros"}
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
                        Categoría #{producto.id_categoria}
                      </div>

                      <h3>
                        {producto.nombre}
                      </h3>

                      <div className="precio">
                        {formatoPrecio(
                          producto.precio
                        )}
                      </div>

                      <div className={`stock ${Number(producto.stock) === 0 ? "stock-agotado" : ""}`}>
                        <span className="punto-stock">●</span>
                        {Number(producto.stock) === 0
                          ? "Agotado"
                          : `${producto.stock} unidades disponibles`}
                      </div>

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

              <label htmlFor="nombre">
                Nombre del producto
              </label>

              <input
                type="text"
                id="nombre"
                name="nombre"
                placeholder="Ej. Mouse Logitech"
                maxLength={100}
                required
                value={
                  formulario.nombre
                }
                onChange={
                  manejarCambio
                }
              />

            </div>

            <div className="campo">

              <label htmlFor="precio">
                Precio
              </label>

              <input
                type="number"
                id="precio"
                name="precio"
                placeholder="Ej. 85000"
                min="1"
                step="1"
                required
                value={
                  formulario.precio
                }
                onChange={
                  manejarCambio
                }
              />

            </div>

            <div className="campo">

              <label htmlFor="stock">
                Stock
              </label>

              <input
                type="number"
                id="stock"
                name="stock"
                placeholder="Ej. 20"
                min="0"
                step="1"
                required
                value={
                  formulario.stock
                }
                onChange={
                  manejarCambio
                }
              />

            </div>

            <div className="campo">

              <label htmlFor="id_categoria">
                ID de categoría
              </label>

              <input
                type="number"
                id="id_categoria"
                name="id_categoria"
                placeholder="Ej. 1"
                min="1"
                step="1"
                required
                value={
                  formulario.id_categoria
                }
                onChange={
                  manejarCambio
                }
              />
              <small>Ingresa el ID de una categoría existente.</small>

            </div>

            <div className="botones-formulario">

              <button
                className="boton-principal"
                type="submit"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : editando
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