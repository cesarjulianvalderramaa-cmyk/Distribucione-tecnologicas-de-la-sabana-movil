import os
import re
from datetime import timedelta
from functools import wraps

from flask import Flask, current_app, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

from base_datos import conectar
from usuarios import asegurar_tabla_usuarios

app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ.get("FLASK_SECRET_KEY"),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE=os.environ.get("SESSION_COOKIE_SAMESITE", "Lax"),
    SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "").lower()
    in {"1", "true", "yes"},
    PERMANENT_SESSION_LIFETIME=timedelta(hours=8),
)
CORS(
    app,
    supports_credentials=True,
    origins=[
        origen.strip()
        for origen in os.environ.get(
            "CORS_ALLOWED_ORIGINS",
            "http://127.0.0.1:5173,http://localhost:5173",
        ).split(",")
        if origen.strip()
    ],
)


def requiere_inicio_sesion(funcion):
    @wraps(funcion)
    def protegida(*args, **kwargs):
        if not current_app.config["SECRET_KEY"]:
            current_app.logger.error("La variable FLASK_SECRET_KEY no está configurada.")
            return jsonify({"error": "El servidor no está configurado para iniciar sesión."}), 500

        if "usuario_id" not in session:
            return jsonify({"error": "Debes iniciar sesión para continuar."}), 401

        return funcion(*args, **kwargs)

    return protegida


@app.route("/api/auth/login", methods=["POST"])
def iniciar_sesion():
    if not app.config["SECRET_KEY"]:
        app.logger.error("La variable FLASK_SECRET_KEY no está configurada.")
        return jsonify({"error": "El servidor no está configurado para iniciar sesión."}), 500

    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return jsonify({"error": "Debes enviar usuario y contraseña."}), 400

    usuario = datos.get("usuario")
    contrasena = datos.get("contrasena")
    if not isinstance(usuario, str) or not isinstance(contrasena, str):
        return jsonify({"error": "Debes enviar usuario y contraseña."}), 400

    conexion = conectar()
    if not conexion:
        return jsonify({"error": "No se pudo conectar a MySQL."}), 500

    cursor = None
    try:
        cursor = conexion.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id_usuario, usuario, contrasena_hash
            FROM Usuario
            WHERE usuario = %s
            """,
            (usuario.strip().lower(),),
        )
        registro = cursor.fetchone()

        if not registro or not check_password_hash(registro["contrasena_hash"], contrasena):
            return jsonify({"error": "Usuario o contraseña incorrectos."}), 401

        session.clear()
        session.permanent = True
        session["usuario_id"] = registro["id_usuario"]
        session["usuario"] = registro["usuario"]
        return jsonify({"usuario": registro["usuario"]})
    except Exception:
        app.logger.exception("No se pudo iniciar la sesión.")
        return jsonify({"error": "No se pudo validar el usuario."}), 500
    finally:
        if cursor:
            cursor.close()
        conexion.close()


@app.route("/api/auth/register", methods=["POST"])
def registrar_usuario():
    if not app.config["SECRET_KEY"]:
        app.logger.error("La variable FLASK_SECRET_KEY no está configurada.")
        return jsonify({"error": "El servidor no está configurado para registrar cuentas."}), 500

    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return jsonify({"error": "Debes enviar usuario y contraseña."}), 400

    usuario = datos.get("usuario")
    contrasena = datos.get("contrasena")
    if not isinstance(usuario, str) or not isinstance(contrasena, str):
        return jsonify({"error": "Debes enviar usuario y contraseña."}), 400

    usuario = usuario.strip().lower()
    if not re.fullmatch(r"[a-z0-9._-]{3,50}", usuario):
        return jsonify({
            "error": "El usuario debe tener entre 3 y 50 caracteres: letras, números, punto, guion o guion bajo."
        }), 400
    if len(contrasena) < 12 or len(contrasena) > 128:
        return jsonify({
            "error": "La contraseña debe tener entre 12 y 128 caracteres."
        }), 400

    conexion = conectar()
    if not conexion:
        return jsonify({"error": "No se pudo conectar a MySQL."}), 500

    cursor = None
    try:
        cursor = conexion.cursor()
        asegurar_tabla_usuarios(cursor)
        cursor.execute(
            """
            INSERT INTO Usuario (usuario, contrasena_hash)
            VALUES (%s, %s)
            """,
            (usuario, generate_password_hash(contrasena)),
        )
        conexion.commit()
        usuario_id = cursor.lastrowid

        session.clear()
        session.permanent = True
        session["usuario_id"] = usuario_id
        session["usuario"] = usuario
        return jsonify({"usuario": usuario}), 201
    except Exception as error:
        conexion.rollback()
        if getattr(error, "errno", None) == 1062:
            return jsonify({"error": "Ese nombre de usuario ya está registrado."}), 409
        app.logger.exception("No se pudo registrar la cuenta.")
        return jsonify({"error": "No se pudo registrar la cuenta."}), 500
    finally:
        if cursor:
            cursor.close()
        conexion.close()


@app.route("/api/auth/me", methods=["GET"])
@requiere_inicio_sesion
def obtener_sesion():
    return jsonify({"usuario": session["usuario"]})


@app.route("/api/auth/logout", methods=["POST"])
@requiere_inicio_sesion
def cerrar_sesion():
    session.clear()
    return jsonify({"mensaje": "Sesión cerrada correctamente."})


@app.route("/api/productos", methods=["GET"])
@requiere_inicio_sesion
def obtener_productos():
    conexion = conectar()

    if not conexion:
        return jsonify({"error": "No se pudo conectar a MySQL"}), 500

    try:
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT id_producto, nombre, precio, stock, id_categoria
            FROM Producto
        """)

        productos = cursor.fetchall()

        return jsonify(productos)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conexion.close()


@app.route("/api/productos", methods=["POST"])
@requiere_inicio_sesion
def crear_producto_api():
    datos = request.json

    nombre = datos.get("nombre")
    precio = datos.get("precio")
    stock = datos.get("stock")
    id_categoria = datos.get("id_categoria")

    if not nombre or precio is None or stock is None or id_categoria is None:
        return jsonify({
            "error": "Todos los campos son obligatorios"
        }), 400

    conexion = conectar()

    if not conexion:
        return jsonify({
            "error": "No se pudo conectar a MySQL"
        }), 500

    try:
        cursor = conexion.cursor()

        sql = """
            INSERT INTO Producto
            (nombre, precio, stock, id_categoria)
            VALUES (%s, %s, %s, %s)
        """

        valores = (
            nombre,
            precio,
            stock,
            id_categoria
        )

        cursor.execute(sql, valores)
        conexion.commit()

        return jsonify({
            "mensaje": "Producto creado correctamente",
            "id_producto": cursor.lastrowid
        }), 201

    except Exception as e:
        conexion.rollback()

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conexion.close()

@app.route("/api/productos/<int:id_producto>", methods=["PUT"])
@requiere_inicio_sesion
def actualizar_producto_api(id_producto):
    datos = request.json

    nombre = datos.get("nombre")
    precio = datos.get("precio")
    stock = datos.get("stock")
    id_categoria = datos.get("id_categoria")

    if not nombre or precio is None or stock is None or id_categoria is None:
        return jsonify({
            "error": "Todos los campos son obligatorios"
        }), 400

    conexion = conectar()

    if not conexion:
        return jsonify({
            "error": "No se pudo conectar a MySQL"
        }), 500

    try:
        cursor = conexion.cursor()

        sql = """
            UPDATE Producto
            SET nombre = %s,
                precio = %s,
                stock = %s,
                id_categoria = %s
            WHERE id_producto = %s
        """

        valores = (
            nombre,
            precio,
            stock,
            id_categoria,
            id_producto
        )

        cursor.execute(sql, valores)
        conexion.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "error": "Producto no encontrado"
            }), 404

        return jsonify({
            "mensaje": "Producto actualizado correctamente"
        })

    except Exception as e:
        conexion.rollback()

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conexion.close()


@app.route("/api/productos/<int:id_producto>", methods=["DELETE"])
@requiere_inicio_sesion
def eliminar_producto_api(id_producto):
    conexion = conectar()

    if not conexion:
        return jsonify({
            "error": "No se pudo conectar a MySQL"
        }), 500

    try:
        cursor = conexion.cursor()

        sql = """
            DELETE FROM Producto
            WHERE id_producto = %s
        """

        cursor.execute(sql, (id_producto,))
        conexion.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "error": "Producto no encontrado"
            }), 404

        return jsonify({
            "mensaje": "Producto eliminado correctamente"
        })

    except Exception as e:
        conexion.rollback()

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conexion.close()

if __name__ == "__main__":
    modo_debug = os.environ.get("FLASK_DEBUG", "").lower() in {"1", "true", "yes"}
    app.run(debug=modo_debug, port=5000)