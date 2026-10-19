# Distribuciones Tecnológicas de la Sabana — Inventario

Aplicación web para la evidencia **GA7-220501096-AA4-EV03**. El front-end está construido con React y Vite; la API está desarrollada con Flask y consulta MySQL.

## Funcionalidades

- Consulta y búsqueda de productos por nombre o código (ID del producto).
- Filtros por categoría y disponibilidad: todos, disponibles, agotados o existencias bajas.
- Avisos de stock bajo para productos con 5 unidades o menos, sin contar los agotados.
- Resumen del inventario: productos registrados, unidades disponibles, productos agotados y existencias bajas.
- Crear, editar y eliminar productos con validaciones y confirmación de borrado.
- Descargar un reporte básico del inventario en formato CSV.
- Registro de cuentas con nombre de usuario y correo electrónico, validación de campos obligatorios y credenciales protegidas con hashes.
- Inicio de sesión con nombre de usuario o correo electrónico y contraseña; la API valida la sesión antes de permitir cualquier operación del inventario.
- Modo de demostración opcional con productos ficticios claramente identificados; los cambios se conservan solo en memoria y nunca se envían a Flask/MySQL.
- Estados de carga, mensajes de resultado y avisos cuando no se puede conectar con la API.
- Diseño adaptable a computadores, tabletas y celulares, con navegación compacta en pantallas pequeñas.

## Organización del frontend

`src/App.jsx` coordina el estado de la sesión y del inventario, las operaciones con la API y las acciones de los usuarios. La interfaz se distribuye en componentes reutilizables dentro de `src/components/`:

- `AuthScreen.jsx`: inicio de sesión, registro y acceso a la demostración.
- `AppHeader.jsx`, `HeroSection.jsx` y `AppFooter.jsx`: estructura y navegación de la aplicación.
- `InventorySection.jsx`: resumen, búsqueda, filtros, mensajes y catálogo de productos.
- `ProductForm.jsx`: formulario para crear y editar productos.
- `InventorySummary.jsx` y `ProductCard.jsx`: indicadores del inventario y tarjeta individual de producto.

## Requisitos

- Python 3 y MySQL.
- Node.js y npm.
- La base de datos `distribuciones_tecnologicas_sabana` creada y accesible desde MySQL.
- Los paquetes `Flask`, `flask-cors` y `mysql-connector-python` instalados.

## Ejecución local

1. Instala las dependencias de la API desde la carpeta raíz del proyecto si aún no están instaladas:

   ```powershell
   python -m pip install Flask flask-cors mysql-connector-python
   ```

2. Configura las credenciales de MySQL en esta terminal. El nombre de la base de datos tiene un valor predeterminado; cambia las variables si tu instalación usa otros datos:

   ```powershell
   $env:MYSQL_HOST = "localhost"
   $env:MYSQL_PORT = "3306"
   $env:MYSQL_USER = "root"
   $env:MYSQL_PASSWORD = "tu-clave-de-MySQL"
   $env:MYSQL_DATABASE = "distribuciones_tecnologicas_sabana"
   ```

   No subas ni compartas la contraseña. En el checkout original, si existe un `conexion.py` local, la aplicación conserva esa conexión local; ese archivo se excluye del repositorio para proteger sus credenciales.

3. El registro desde la pantalla solicita un nombre de usuario, correo electrónico y contraseña, crea la tabla `Usuario` si todavía no existe y migra la tabla existente para añadir el correo. Si prefieres crear una cuenta inicial desde la terminal, ejecuta este comando; solicita el correo y la contraseña (sin mostrarla), que debe tener al menos 12 caracteres:

   ```powershell
   python crear_usuario.py
   ```

4. En la terminal donde ejecutarás Flask, define una clave secreta nueva para firmar las sesiones e inicia la API desde la carpeta raíz:

   ```powershell
   $env:FLASK_SECRET_KEY = (python -c "import secrets; print(secrets.token_hex(32))")
   python api.py
   ```

   Flask queda disponible en `http://127.0.0.1:5000`. Conserva la clave en un lugar seguro y usa la misma mientras el servidor siga activo. Si reinicias Flask, puedes definir una clave nueva; las sesiones anteriores dejarán de ser válidas.

5. En otra terminal, inicia el front-end:

   ```powershell
   cd frontend-react
   npm install
   npm run dev
   ```

6. Abre la dirección local que muestra Vite en la terminal. Puedes crear una cuenta desde **Regístrate** o iniciar sesión con una cuenta existente. Durante el desarrollo, Vite redirige las solicitudes `/api` a Flask. Si Flask corre en una terminal diferente, configura también ahí las variables `MYSQL_*` indicadas arriba.

Los nombres de usuario aceptan de 3 a 50 letras, números, puntos, guiones o guion bajo. El correo debe tener formato válido y ser único. Las contraseñas deben tener entre 12 y 128 caracteres y se guardan como hashes. El registro público permite a cada cuenta administrar el inventario. Si el front-end y la API se despliegan en orígenes distintos, configura `VITE_API_URL` con la URL completa del endpoint `/api/productos` y agrega el origen exacto del front-end a `CORS_ALLOWED_ORIGINS` (separados por comas). Para una integración entre sitios distintos, configura también `SESSION_COOKIE_SAMESITE=None` y `SESSION_COOKIE_SECURE=true`, y usa HTTPS. En producción, usa una clave secreta persistente y no ejecutes el servidor Flask de depuración como servidor de producción.

## Verificación de la evidencia

Con MySQL y Flask activos, abre la aplicación y comprueba:

1. Que sin iniciar sesión no se pueda consultar ni modificar el inventario.
2. Que la cuenta válida permita entrar tanto con su nombre de usuario como con su correo; una contraseña incorrecta debe mostrar un error.
3. Que el registro exija un nombre de usuario, correo válido y contraseña; prueba también un correo inválido, un usuario o correo duplicado y contraseñas que no coinciden.
4. Que cerrar sesión vuelva a la pantalla de acceso y bloquee las operaciones del inventario.
5. Que el resumen y el catálogo correspondan con los productos de la base de datos.
6. La búsqueda por nombre o código, el filtro por categoría y los filtros de disponibilidad.
7. Que el indicador de existencias bajas incluya productos con 1 a 5 unidades y no cuente productos agotados.
8. La descarga del reporte CSV con los productos del inventario.
9. La creación de un producto usando un ID de categoría existente.
10. La edición del producto y la actualización de su precio o stock.
11. La cancelación y confirmación al eliminar un producto.
12. El modo de demostración: debe mostrar la etiqueta de datos ficticios y permitir CRUD local sin modificar el backend.
13. El diseño y menú en una ventana de escritorio y en una ventana angosta de celular.

La gestión de ventas y el descuento automático de stock no hacen parte de esta versión.
