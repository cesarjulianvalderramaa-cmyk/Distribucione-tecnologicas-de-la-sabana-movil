import unittest
from unittest.mock import patch

import api


class CursorFalso:
    def __init__(
        self,
        filas=None,
        rowcount=1,
        producto_existente=True,
        error=None,
    ):
        self.filas = filas or []
        self.rowcount = rowcount
        self.producto_existente = producto_existente
        self.error = error
        self.consultas = []
        self.lastrowid = 42
        self.cerrado = False

    def execute(self, consulta, valores=None):
        self.consultas.append((consulta, valores))
        if self.error:
            raise self.error

    def fetchall(self):
        return self.filas

    def fetchone(self):
        return (1,) if self.producto_existente else None

    def close(self):
        self.cerrado = True


class ConexionFalsa:
    def __init__(self, cursor):
        self.cursor_falso = cursor
        self.confirmada = False
        self.revertida = False
        self.cerrada = False

    def cursor(self, **_kwargs):
        return self.cursor_falso

    def commit(self):
        self.confirmada = True

    def rollback(self):
        self.revertida = True

    def close(self):
        self.cerrada = True


class PruebasProductos(unittest.TestCase):
    producto = {
        "nombre": " Mouse ",
        "precio": 85000,
        "stock": 10,
        "id_categoria": 1,
    }

    def setUp(self):
        self.clave_anterior = api.app.config["SECRET_KEY"]
        api.app.config.update(TESTING=True, SECRET_KEY="clave-de-prueba")
        self.cliente = api.app.test_client()
        with self.cliente.session_transaction() as sesion:
            sesion["usuario_id"] = 1

    def tearDown(self):
        api.app.config["SECRET_KEY"] = self.clave_anterior

    def test_crear_rechaza_datos_invalidos_antes_de_conectar(self):
        casos = (
            ({"nombre": " ", "precio": 10, "stock": 1, "id_categoria": 1}, "nombre"),
            ({**self.producto, "precio": float("nan")}, "precio"),
            ({**self.producto, "precio": -1}, "precio"),
            ({**self.producto, "stock": -1}, "stock"),
            ({**self.producto, "stock": 1.5}, "stock"),
            ({**self.producto, "id_categoria": 0}, "categoría"),
        )
        for datos, campo in casos:
            with self.subTest(campo=campo, datos=datos):
                with patch.object(api, "conectar") as conectar:
                    respuesta = self.cliente.post("/api/productos", json=datos)

                self.assertEqual(respuesta.status_code, 400)
                self.assertIn(campo, respuesta.json["error"])
                conectar.assert_not_called()

    def test_crear_producto_devuelve_201_y_guarda_valores_normalizados(self):
        cursor = CursorFalso()
        conexion = ConexionFalsa(cursor)
        with patch.object(api, "conectar", return_value=conexion):
            respuesta = self.cliente.post("/api/productos", json=self.producto)

        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.json["id_producto"], 42)
        self.assertTrue(conexion.confirmada)
        self.assertEqual(cursor.consultas[0][1], ("Mouse", 85000, 10, 1))
        self.assertTrue(cursor.cerrado)
        self.assertTrue(conexion.cerrada)

    def test_listar_productos_devuelve_resultados_json(self):
        productos = [{"id_producto": 4, "nombre": "Mouse"}]
        cursor = CursorFalso(filas=productos)
        with patch.object(api, "conectar", return_value=ConexionFalsa(cursor)):
            respuesta = self.cliente.get("/api/productos")

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.json, productos)

    def test_actualizar_producto_admite_un_registro_sin_cambios(self):
        cursor = CursorFalso(rowcount=0)
        conexion = ConexionFalsa(cursor)
        with patch.object(api, "conectar", return_value=conexion):
            respuesta = self.cliente.put("/api/productos/4", json=self.producto)

        self.assertEqual(respuesta.status_code, 200)
        self.assertTrue(conexion.confirmada)
        self.assertEqual(len(cursor.consultas), 2)

    def test_actualizar_producto_inexistente_devuelve_404(self):
        cursor = CursorFalso(rowcount=0, producto_existente=False)
        conexion = ConexionFalsa(cursor)
        with patch.object(api, "conectar", return_value=conexion):
            respuesta = self.cliente.put("/api/productos/4", json=self.producto)

        self.assertEqual(respuesta.status_code, 404)
        self.assertTrue(cursor.cerrado)
        self.assertTrue(conexion.cerrada)

    def test_eliminar_producto_inexistente_devuelve_404(self):
        cursor = CursorFalso(rowcount=0)
        with patch.object(api, "conectar", return_value=ConexionFalsa(cursor)):
            respuesta = self.cliente.delete("/api/productos/4")

        self.assertEqual(respuesta.status_code, 404)

    def test_error_de_consulta_devuelve_500_sin_exponer_detalles(self):
        cursor = CursorFalso(error=RuntimeError("detalle interno de MySQL"))
        conexion = ConexionFalsa(cursor)
        with patch.object(api, "conectar", return_value=conexion):
            respuesta = self.cliente.get("/api/productos")

        self.assertEqual(respuesta.status_code, 500)
        self.assertNotIn("detalle interno de MySQL", respuesta.json["error"])
        self.assertTrue(cursor.cerrado)
        self.assertTrue(conexion.cerrada)

    def test_error_de_conexion_devuelve_500(self):
        with patch.object(api, "conectar", return_value=None):
            respuesta = self.cliente.get("/api/productos")

        self.assertEqual(respuesta.status_code, 500)
        self.assertIn("conectar a MySQL", respuesta.json["error"])


if __name__ == "__main__":
    unittest.main()
