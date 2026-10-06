from conexion import conectar


def crear_producto(nombre, precio, stock, id_categoria):
    conexion = conectar()

    if conexion:
        try:
            cursor = conexion.cursor()

            sql = """
                INSERT INTO Producto
                (nombre, precio, stock, id_categoria)
                VALUES (%s, %s, %s, %s)
            """

            valores = (nombre, precio, stock, id_categoria)

            cursor.execute(sql, valores)
            conexion.commit()

            print("Producto creado correctamente.")

        except Exception as e:
            print("Error al crear el producto:", e)

        finally:
            cursor.close()
            conexion.close()


def listar_productos():
    conexion = conectar()

    if conexion:
        try:
            cursor = conexion.cursor()

            cursor.execute("""
                SELECT id_producto, nombre, precio, stock, id_categoria
                FROM Producto
            """)

            productos = cursor.fetchall()

            print("\n--- LISTA DE PRODUCTOS ---")

            for producto in productos:
                print(producto)

        except Exception as e:
            print("Error al consultar los productos:", e)

        finally:
            cursor.close()
            conexion.close()
def actualizar_producto(id_producto, nombre, precio, stock, id_categoria):
    conexion = conectar()

    if conexion:
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

            print("Producto actualizado correctamente.")

        except Exception as e:
            print("Error al actualizar el producto:", e)

        finally:
            cursor.close()
            conexion.close()


def eliminar_producto(id_producto):
    conexion = conectar()

    if conexion:
        try:
            cursor = conexion.cursor()

            sql = """
                DELETE FROM Producto
                WHERE id_producto = %s
            """

            cursor.execute(sql, (id_producto,))
            conexion.commit()

            print("Producto eliminado correctamente.")

        except Exception as e:
            print("Error al eliminar el producto:", e)

        finally:
            cursor.close()
            conexion.close()
            