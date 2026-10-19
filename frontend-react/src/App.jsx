import { useEffect, useState } from "react";
import "./App.css";
import AppFooter from "./components/AppFooter.jsx";
import AppHeader from "./components/AppHeader.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import HeroSection from "./components/HeroSection.jsx";
import InventorySection from "./components/InventorySection.jsx";
import ProductForm from "./components/ProductForm.jsx";

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
      <AuthScreen
        modoAcceso={modoAcceso}
        setModoAcceso={setModoAcceso}
        errorAcceso={errorAcceso}
        setErrorAcceso={setErrorAcceso}
        manejarAcceso={manejarAcceso}
        usuarioAcceso={usuarioAcceso}
        setUsuarioAcceso={setUsuarioAcceso}
        contrasenaAcceso={contrasenaAcceso}
        setContrasenaAcceso={setContrasenaAcceso}
        confirmarContrasena={confirmarContrasena}
        setConfirmarContrasena={setConfirmarContrasena}
        iniciandoSesion={iniciandoSesion}
        iniciarDemostracion={iniciarDemostracion}
      />
    );
  }

  return (
    <div className="tienda">

      {/* =================================
          ENCABEZADO
      ================================= */}

      <AppHeader
        menuAbierto={menuMovilAbierto}
        setMenuAbierto={setMenuMovilAbierto}
        usuarioActual={usuarioActual}
        modoDemo={modoDemo}
        onLogout={manejarCierreSesion}
      />

      {/* =================================
          HERO
      ================================= */}

      <HeroSection />

      {/* =================================
          CONTENIDO
      ================================= */}

      <main className="contenido">
        <InventorySection
          modoDemo={modoDemo}
          productos={productos}
          unidadesInventario={unidadesInventario}
          productosAgotados={productosAgotados}
          productosStockBajo={productosStockBajo}
          umbralStockBajo={UMBRAL_STOCK_BAJO}
          error={error}
          cargando={cargando}
          productosFiltrados={productosFiltrados}
          categorias={categorias}
          filtroStock={filtroStock}
          setFiltroStock={setFiltroStock}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          mensaje={mensaje}
          setCargando={setCargando}
          cargarProductos={cargarProductos}
          formatoPrecio={formatoPrecio}
          editarProducto={editarProducto}
          eliminarProducto={eliminarProducto}
          descargarReporte={descargarReporte}
        />
        <ProductForm
          formulario={formulario}
          manejarCambio={manejarCambio}
          manejarSubmit={manejarSubmit}
          editando={editando}
          guardando={guardando}
          limpiarFormulario={limpiarFormulario}
        />
      </main>

      {/* =================================
          PIE DE PÁGINA
      ================================= */}

      <AppFooter />

    </div>
  );
}

export default App;