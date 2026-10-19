function AuthScreen({
  modoAcceso,
  setModoAcceso,
  errorAcceso,
  setErrorAcceso,
  manejarAcceso,
  usuarioAcceso,
  setUsuarioAcceso,
  contrasenaAcceso,
  setContrasenaAcceso,
  confirmarContrasena,
  setConfirmarContrasena,
  iniciandoSesion,
  iniciarDemostracion,
}) {
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

export default AuthScreen;
