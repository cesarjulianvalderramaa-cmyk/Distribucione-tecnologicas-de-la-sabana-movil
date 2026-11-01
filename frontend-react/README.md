# Distribuciones Tecnológicas de la Sabana — Inventario

Aplicación web para la evidencia **GA7-220501096-AA4-EV03**. El front-end está construido con React y Vite; la API está desarrollada con Node.js y Express y consulta MySQL.

## Funcionalidades

- Consulta y búsqueda de productos por nombre o código (ID del producto).
- Filtros por categoría y disponibilidad: todos, disponibles, agotados o existencias bajas.
- Avisos de stock bajo para productos con 5 unidades o menos, sin contar los agotados.
- Resumen del inventario: productos registrados, unidades disponibles, productos agotados y existencias bajas.
- Crear, editar y eliminar productos con validaciones y confirmación de borrado.
- Cargar, previsualizar, reemplazar y quitar imágenes JPG, PNG o WebP desde el formulario; se guardan en MySQL y no requieren modificar archivos del proyecto.
- Descargar un reporte básico del inventario en formato CSV.
- Registro e inicio de sesión con contraseñas protegidas mediante hashes y sesiones HTTP-only.
- Modo de demostración opcional con productos ficticios; los cambios se conservan solo en memoria y nunca se envían a Node.js/MySQL.
- Estados de carga, mensajes de resultado y avisos cuando no se puede conectar con la API.
- Diseño adaptable a computadores, tabletas y celulares.

## Requisitos

- Node.js 18 o posterior y npm.
- MySQL con la base de datos `distribuciones_tecnologicas_sabana` creada y accesible.

## Ejecución local

1. Desde la carpeta raíz, instala las dependencias de la API y crea el archivo local de configuración:

   ```powershell
   npm install
   if (!(Test-Path .env)) { Copy-Item .env.example .env }
   ```

2. Edita `.env` con tus credenciales de MySQL y una clave de sesión aleatoria. Por ejemplo, en PowerShell puedes generar la clave así:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Asigna el resultado a `SESSION_SECRET` en `.env`; completa `MYSQL_PASSWORD` y ajusta `MYSQL_HOST`, `MYSQL_USER` o `MYSQL_DATABASE` si es necesario. No compartas ni subas `.env`.

3. Inicia la API desde la carpeta raíz:

   ```powershell
   npm start
   ```

   La API queda disponible en `http://127.0.0.1:5000`. Al registrar la primera cuenta, la API crea la tabla `Usuario` si no existe. Si la tabla ya existe sin columna de correo, la agrega para admitir el registro actual.

4. En otra terminal, inicia React:

   ```powershell
   cd frontend-react
   npm install
   npm run dev
   ```

5. Abre la dirección local que muestra Vite. El proxy de desarrollo redirige `/api` a Node.js. Puedes registrarte desde **Regístrate** o acceder con una cuenta ya creada.

Las contraseñas deben tener entre 12 y 128 caracteres y se almacenan como hashes scrypt. Las cuentas creadas anteriormente con hashes scrypt o PBKDF2 de Werkzeug pueden iniciar sesión; al autenticarse, los hashes PBKDF2 se actualizan automáticamente a scrypt. Si el front-end y la API se despliegan en orígenes distintos, configura `VITE_API_URL` con la URL completa de `/api/productos` y agrega el origen exacto del front-end a `CORS_ALLOWED_ORIGINS` (separados por comas). Para integración entre sitios distintos, configura `SESSION_COOKIE_SAMESITE=None` y `SESSION_COOKIE_SECURE=true`, y usa HTTPS. En producción, usa un `SESSION_SECRET` persistente y sustituye el almacén de sesiones en memoria por uno persistente.

La API agrega automáticamente la columna `imagen` a la tabla `Producto` si no existe. Desde **Administración de productos**, elige una imagen de hasta 2 MB; la vista previa aparece antes de guardar. Al editar, puedes reemplazarla o quitarla. Las imágenes se almacenan como datos asociados al producto en MySQL.

El backend Node.js está organizado por responsabilidad: `backend/api.js` inicia el servidor, `backend/app.js` configura Express, `backend/routes/` agrupa los endpoints, `backend/middleware/` contiene la autorización, `backend/services/` la lógica reutilizable, `backend/validators/` las validaciones y `backend/database.js` centraliza MySQL y las migraciones compatibles.

Los endpoints autenticados incluyen `GET/POST /api/productos`, `GET/PUT/DELETE /api/productos/:id`, `GET /api/categorias` (IDs de categoría existentes en productos) y `GET /api/inventario/resumen`. La autenticación se gestiona mediante `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` y `POST /api/auth/logout`.

## Verificación

Con MySQL y Node.js activos, comprueba el registro e inicio de sesión, el bloqueo del inventario para usuarios no autenticados, las operaciones CRUD, la búsqueda y filtros, el reporte CSV, el modo de demostración y el diseño en escritorio y celular. La gestión de ventas y el descuento automático de stock no hacen parte de esta versión.

Para ejecutar las pruebas unitarias del backend:

```powershell
npm test
```
