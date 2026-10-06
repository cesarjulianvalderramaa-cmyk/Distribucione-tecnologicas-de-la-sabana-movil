from flask import Flask, jsonify, request
from flask_cors import CORS
from conexion import conectar

app = Flask(__name__)
CORS(app)


@app.route("/api/productos", methods=["GET"])
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
    app.run(debug=True, port=5000)