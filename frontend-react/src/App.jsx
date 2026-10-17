import { useEffect, useState } from "react";
import "./App.css";
import InventorySummary from "./components/InventorySummary.jsx";
import ProductCard from "./components/ProductCard.jsx";

const API_URL = import.meta.env.VITE_API_URL || "/api/productos";
const AUTH_URL = API_URL.replace(/\/productos\/?$/, "/auth");
const UMBRAL_STOCK_BAJO = 5;
const PRODUCTOS_DEMO = [
  { id_producto: 1001, nombre: "Mouse inalámbrico de oficina", precio: 45000, stock: 2, id_categoria: 1 },
  { id_producto: 1002, nombre: "Teclado mecánico RGB", precio: 185000, stock: 8, id_categoria: 1 },
  { id_producto: 1003, nombre: "Monitor LED 24 pulgadas", precio: 620000, stock: 0, id_categoria: 2 },
  { id_producto: 1004, nombre: "Laptop empresarial", precio: 2450000, stock: 12, id_categoria: 2 },
];

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
  const [modoDemo, setModoDemo] = useState(false);
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
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
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
    if (!usuarioActual || modoDemo) return undefined;

    let activo = true;
    const cargarInventario = async () => {
      try {
        const productosCargados = await obtenerProductos();
        if (activo) {
          setProductos(productosCargados);
          setError("");
        }
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
  }, [usuarioActual, modoDemo]);

  const iniciarDemostracion = () => {
    setProductos(PRODUCTOS_DEMO.map((producto) => ({ ...producto })));
    setUsuarioActual(null);
    setModoDemo(true);
    setCargando(false);
    setError("");
    setMensaje("");
    limpiarFormulario();
  };

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
    if (modoDemo) {
      setProductos([]);
      setModoDemo(false);
      setCargando(true);
      setMensaje("");
      setError("");
      setModoAcceso("login");
      return;
    }

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
      if (modoDemo) {
        if (editando) {
          setProductos((actuales) =>
            actuales.map((producto) =>
              producto.id_producto === editando
                ? { ...producto, ...datos }
                : producto
            )
          );
        } else {
          const idProducto = Math.max(
            ...productos.map((producto) => producto.id_producto),
            1000
          ) + 1;
          setProductos((actuales) => [
            ...actuales,
            { id_producto: idProducto, ...datos },
          ]);
        }
      } else {
        const respuesta = await solicitarApi(
          editando ? `${API_URL}/${editando}` : API_URL,
          {
            method: editando ? "PUT" : "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos),
          }
        );
        await leerRespuesta(respuesta);
      }

      if (editando) {
        setMensaje(
          modoDemo
            ? "Producto actualizado en la demostración. No se guardó en la base de datos."
            : "Producto actualizado correctamente."
        );
      } else {
        setMensaje(
          modoDemo
            ? "Producto creado en la demostración. No se guardó en la base de datos."
            : "Producto creado correctamente."
        );
      }

      limpiarFormulario();

      if (!modoDemo) await cargarProductos();

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
      if (modoDemo) {
        setProductos((actuales) =>
          actuales.filter((producto) => producto.id_producto !== id)
        );
        setMensaje("Producto eliminado de la demostración. No se modificó la base de datos.");
      } else {
        const respuesta = await solicitarApi(`${API_URL}/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        await leerRespuesta(respuesta);
        setMensaje("Producto eliminado correctamente.");
        await cargarProductos();
      }
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
      const coincideBusqueda = `${producto.nombre} ${producto.id_producto} ${producto.id_categoria}`
        .toLowerCase()
        .includes(busqueda.trim().toLowerCase());
      const coincideStock =
        filtroStock === "todos" ||
        (filtroStock === "disponibles" && Number(producto.stock) > 0) ||
        (filtroStock === "agotados" && Number(producto.stock) === 0) ||
        (filtroStock === "bajos" &&
          Number(producto.stock) > 0 &&
          Number(producto.stock) <= UMBRAL_STOCK_BAJO);
      const coincideCategoria =
        filtroCategoria === "todas" ||
        Number(producto.id_categoria) === Number(filtroCategoria);

      return coincideBusqueda && coincideStock && coincideCategoria;
    }
  );

  const categorias = [...new Set(productos.map((producto) => Number(producto.id_categoria)))]
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const unidadesInventario = productos.reduce(
    (total, producto) => total + Number(producto.stock),
    0
  );
  const productosAgotados = productos.filter(
    (producto) => Number(producto.stock) === 0
  ).length;
  const productosStockBajo = productos.filter(
    (producto) =>
      Number(producto.stock) > 0 &&
      Number(producto.stock) <= UMBRAL_STOCK_BAJO
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

  const descargarReporte = () => {
    const escaparCsv = (valor) => {
      const texto = String(valor);
      const seguro = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
      return `"${seguro.replaceAll('"', '""')}"`;
    };
    const filas = [
      ["Código", "Producto", "Precio COP", "Existencias", "ID categoría"],
      ...productos.map((producto) => [
        producto.id_producto,
        producto.nombre,
        producto.precio,
        producto.stock,
        producto.id_categoria,
      ]),
    ];
    const contenido = `\uFEFF${filas.map((fila) => fila.map(escaparCsv).join(";")).join("\r\n")}`;
    const archivo = new Blob([contenido], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = modoDemo
      ? "reporte-inventario-demostracion-datos-ficticios.csv"
      : "reporte-inventario.csv";
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  if (!usuarioActual && !modoDemo) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-identidad">
            <span className="auth-marca">DS</span>
            <div>
              <strong>Distribuciones</strong>
              <span>Tecnológicas de la Sabana</span>
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
          {modoAcceso === "login" && (
            <div className="demo-acceso">
              <p>¿Solo quieres explorar la interfaz?</p>
              <button
                className="boton-demostracion"
                onClick={iniciarDemostracion}
                type="button"
              >
                Probar demostración con datos ficticios
              </button>
              <small>Los cambios se mantienen solo mientras esta pestaña está abierta y no se guardan en MySQL.</small>
            </div>
          )}
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

        <div className="logo marca-empresa">
          <span className="marca-iniciales" aria-hidden="true">DS</span>
          <span className="marca-nombre">
            Distribuciones
            <strong>Tecnológicas de la Sabana</strong>
          </span>
        </div>

        <button
          aria-expanded={menuMovilAbierto}
          aria-controls="navegacion-principal"
          aria-label={menuMovilAbierto ? "Cerrar menú" : "Abrir menú"}
          className="boton-menu-movil"
          onClick={() => setMenuMovilAbierto((abierto) => !abierto)}
          type="button"
        >
          <span aria-hidden="true">{menuMovilAbierto ? "✕" : "☰"}</span>
          <span>Menú</span>
        </button>

        <nav
          aria-label="Navegación principal"
          className={`menu ${menuMovilAbierto ? "menu-abierto" : ""}`}
          id="navegacion-principal"
        >
          <button
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
              setMenuMovilAbierto(false);
            }}
            type="button"
          >
            Inicio
          </button>

          <button
            onClick={() => {
              document
                .getElementById("productos")
                ?.scrollIntoView({
                  behavior: "smooth",
                });
              setMenuMovilAbierto(false);
            }}
            type="button"
          >
            Productos
          </button>

          <button
            onClick={() => {
              document
                .getElementById("administracion")
                ?.scrollIntoView({
                  behavior: "smooth",
                });
              setMenuMovilAbierto(false);
            }}
            type="button"
          >
            Administración
          </button>
        </nav>

        <div className="acciones-sesion">
          <span className="saludo-usuario">
            {modoDemo ? "Modo de demostración" : `Hola, ${usuarioActual}`}
          </span>
          <button
            className="boton-nuevo-producto"
            type="button"
            onClick={() =>
              document
                .getElementById("administracion")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            + Nuevo producto
          </button>
          <button className="boton-cerrar-sesion" onClick={manejarCierreSesion} type="button">
            {modoDemo ? "Salir de demostración" : "Cerrar sesión"}
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
            Administra el catálogo de productos de Distribuciones Tecnológicas de la Sabana
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
          umbralStockBajo={UMBRAL_STOCK_BAJO}
          inventarioDisponible={modoDemo || !(error && productos.length === 0)}
        />

        {/* TÍTULO */}

        <div className="encabezado-productos">

          <div>
            <p className="subtitulo">
              CATÁLOGO
            </p>

            <h2 className="titulo-seccion">
              Nuestros productos
            </h2>
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

        {/* =================================
            BUSCADOR
        ================================= */}

        <div className="contenedor-buscador">

          <span aria-hidden="true">⌕</span>

          <input
            className="buscador"
            type="text"
            aria-label="Buscar productos por nombre o código"
            placeholder="Buscar por nombre o código..."
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

        <div className="filtros-inventario">
          <div className="categorias" aria-label="Filtrar por disponibilidad">

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

          <button
            className={`categoria ${filtroStock === "bajos" ? "activa" : ""}`}
            aria-pressed={filtroStock === "bajos"}
            onClick={() => setFiltroStock("bajos")}
            type="button"
          >
            Existencias bajas
          </button>

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
                    setFiltroCategoria("todas");
                  }
                }}
              >
                {error ? "Reintentar" : "Limpiar filtros"}
              </button>
            </div>

          ) : (

            productosFiltrados.map((producto) => (
              <ProductCard
                key={producto.id_producto}
                producto={producto}
                umbralStockBajo={UMBRAL_STOCK_BAJO}
                formatoPrecio={formatoPrecio}
                onEdit={editarProducto}
                onDelete={eliminarProducto}
              />
            ))

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
          <span>Tecnológicas de la Sabana</span>
        </div>

        <p>
          Tecnología, calidad y servicio.
        </p>

        <p>
          © 2026 Distribuciones Tecnológicas de la Sabana
        </p>

      </footer>

    </div>
  );
}

export default App;