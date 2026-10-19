function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-texto">
        <p className="hero-etiqueta">SISTEMA DE INVENTARIO</p>
        <h1>Gestiona el inventario de la Sabana</h1>
        <p>
          Administra el catálogo de productos de Distribuciones Tecnológicas de la Sabana
          desde un solo lugar.
        </p>
        <button
          className="boton-hero"
          onClick={() =>
            document.getElementById("productos")?.scrollIntoView({
              behavior: "smooth",
            })
          }
          type="button"
        >
          Ver inventario →
        </button>
      </div>
      <div className="hero-producto">
        <div className="hero-circulo">💻</div>
      </div>
    </section>
  );
}

export default HeroSection;
