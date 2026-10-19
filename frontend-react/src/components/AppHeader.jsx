function AppHeader({ menuAbierto, setMenuAbierto, usuarioActual, modoDemo, onLogout }) {
  const navegarA = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuAbierto(false);
  };

  return (
    <header className="encabezado">
      <div className="logo marca-empresa">
        <span className="marca-iniciales" aria-hidden="true">DS</span>
        <span className="marca-nombre">
          Distribuciones
          <strong>Tecnológicas de la Sabana</strong>
        </span>
      </div>

      <button
        aria-expanded={menuAbierto}
        aria-controls="navegacion-principal"
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        className="boton-menu-movil"
        onClick={() => setMenuAbierto((abierto) => !abierto)}
        type="button"
      >
        <span aria-hidden="true">{menuAbierto ? "✕" : "☰"}</span>
        <span>Menú</span>
      </button>

      <nav
        aria-label="Navegación principal"
        className={`menu ${menuAbierto ? "menu-abierto" : ""}`}
        id="navegacion-principal"
      >
        <button onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setMenuAbierto(false);
        }} type="button">
          Inicio
        </button>
        <button onClick={() => navegarA("productos")} type="button">
          Productos
        </button>
        <button onClick={() => navegarA("administracion")} type="button">
          Administración
        </button>
      </nav>

      <div className="acciones-sesion">
        <span className="saludo-usuario">
          {modoDemo ? "Modo de demostración" : `Hola, ${usuarioActual}`}
        </span>
        <button
          className="boton-nuevo-producto"
          onClick={() => navegarA("administracion")}
          type="button"
        >
          + Nuevo producto
        </button>
        <button className="boton-cerrar-sesion" onClick={onLogout} type="button">
          {modoDemo ? "Salir de demostración" : "Cerrar sesión"}
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
