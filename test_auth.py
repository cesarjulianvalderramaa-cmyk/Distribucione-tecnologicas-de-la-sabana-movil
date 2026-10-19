import unittest
from unittest.mock import patch

import api


class CursorFalso:
    def __init__(self, registro=None, error_insertar=None, tiene_correo=True):
        self.registro = registro
        self.error_insertar = error_insertar
        self.tiene_correo = tiene_correo
        self.consultas = []
        self.lastrowid = 42

    def execute(self, consulta, valores=None):
        self.consultas.append((consulta, valores))
        if consulta.lstrip().startswith("INSERT") and self.error_insertar:
            raise self.error_insertar

    def fetchone(self):
        consulta = self.consultas[-1][0]
        if "INFORMATION_SCHEMA.COLUMNS" in consulta:
            return {"COLUMN_NAME": "correo"} if self.tiene_correo else None
        registro = self.registro
        self.registro = None
        return registro

    def close(self):
        pass


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


class PruebasAutenticacion(unittest.TestCase):
    def setUp(self):
        self.clave_anterior = api.app.config["SECRET_KEY"]
        api.app.config.update(TESTING=True, SECRET_KEY="clave-de-prueba")
        self.cliente = api.app.test_client()

    def tearDown(self):
        api.app.config["SECRET_KEY"] = self.clave_anterior

    def test_registro_rechaza_correo_invalido_sin_conectar_a_base_de_datos(self):
        with patch.object(api, "conectar") as conectar:
            respuesta = self.cliente.post(
                "/api/auth/register",
                json={
                    "usuario": "usuario",
                    "correo": "correo-invalido",
                    "contrasena": "contrasena-segura-123",
                },
            )

        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("correo electrónico válido", respuesta.json["error"])
        conectar.assert_not_called()

    def test_registro_rechaza_campos_obligatorios_vacios(self):
        with patch.object(api, "conectar") as conectar:
            respuesta = self.cliente.post(
                "/api/auth/register",
                json={
                    "usuario": "usuario",
                    "correo": "usuario@correo.com",
                    "contrasena": "   ",
                },
            )

        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("usuario, correo electrónico y contraseña", respuesta.json["error"])
        conectar.assert_not_called()

    def test_registro_rechaza_usuario_con_formato_invalido(self):
        with patch.object(api, "conectar") as conectar:
            respuesta = self.cliente.post(
                "/api/auth/register",
                json={
                    "usuario": "usuario no valido",
                    "correo": "usuario@correo.com",
                    "contrasena": "contrasena-segura-123",
                },
            )

        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("El usuario debe tener", respuesta.json["error"])
        conectar.assert_not_called()

    def test_registro_rechaza_contrasena_fuera_del_limite(self):
        with patch.object(api, "conectar") as conectar:
            respuesta = self.cliente.post(
                "/api/auth/register",
                json={
                    "usuario": "usuario",
                    "correo": "usuario@correo.com",
                    "contrasena": "corta",
                },
            )

        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("entre 12 y 128 caracteres", respuesta.json["error"])
        conectar.assert_not_called()

    def test_registro_normaliza_correo_y_guarda_hash_de_contrasena(self):
        cursor = CursorFalso(tiene_correo=False)
        conexion = ConexionFalsa(cursor)
        with patch.object(api, "conectar", return_value=conexion):
            respuesta = self.cliente.post(
                "/api/auth/register",
                json={
                    "usuario": " Nuevo.Usuario ",
                    "correo": " Cesar@Correo.COM ",
                    "contrasena": "contrasena-segura-123",
                },
            )

        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.json, {"usuario": "nuevo.usuario"})
        self.assertTrue(conexion.confirmada)
        insercion = next(
            valores
            for consulta, valores in cursor.consultas
            if consulta.lstrip().startswith("INSERT")
        )
        self.assertEqual(insercion[:2], ("nuevo.usuario", "cesar@correo.com"))
        self.assertNotEqual(insercion[2], "contrasena-segura-123")
        creacion_tabla = next(
            consulta
            for consulta, _ in cursor.consultas
            if "CREATE TABLE IF NOT EXISTS Usuario" in consulta
        )
        self.assertIn("usuario VARCHAR(50) NOT NULL UNIQUE", creacion_tabla)
        self.assertIn("correo VARCHAR(254) NOT NULL UNIQUE", creacion_tabla)
        self.assertTrue(
            any("ALTER TABLE Usuario" in consulta for consulta, _ in cursor.consultas)
        )

    def test_registro_rechaza_usuario_o_correo_duplicado(self):
        class ErrorDuplicado(Exception):
            errno = 1062

        casos = (
            ("usuario", "usuario@otro-correo.com"),
            ("otro-usuario", "usuario@correo.com"),
        )
        for usuario, correo in casos:
            campo_duplicado = "usuario" if usuario == "usuario" else "correo"
            with self.subTest(campo_duplicado=campo_duplicado):
                cursor = CursorFalso(error_insertar=ErrorDuplicado())
                conexion = ConexionFalsa(cursor)
                with patch.object(api, "conectar", return_value=conexion):
                    respuesta = self.cliente.post(
                        "/api/auth/register",
                        json={
                            "usuario": usuario,
                            "correo": correo,
                            "contrasena": "contrasena-segura-123",
                        },
                    )

                self.assertEqual(respuesta.status_code, 409)
                self.assertIn("nombre de usuario o correo electrónico", respuesta.json["error"])
                self.assertTrue(conexion.revertida)

    def test_login_rechaza_campos_vacios(self):
        with patch.object(api, "conectar") as conectar:
            respuesta = self.cliente.post(
                "/api/auth/login",
                json={"usuario": " ", "contrasena": ""},
            )

        self.assertEqual(respuesta.status_code, 400)
        conectar.assert_not_called()

    def test_login_rechaza_contrasena_de_espacios(self):
        with patch.object(api, "conectar") as conectar:
            respuesta = self.cliente.post(
                "/api/auth/login",
                json={"usuario": "usuario", "contrasena": "   "},
            )

        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("usuario o correo electrónico y contraseña", respuesta.json["error"])
        conectar.assert_not_called()

    def test_login_acepta_credenciales_validas_y_crea_sesion(self):
        from werkzeug.security import generate_password_hash

        cursor = CursorFalso(
            registro={
                "id_usuario": 7,
                "usuario": "usuario",
                "contrasena_hash": generate_password_hash("contrasena-segura-123"),
            }
        )
        conexion = ConexionFalsa(cursor)
        with patch.object(api, "conectar", return_value=conexion):
            respuesta = self.cliente.post(
                "/api/auth/login",
                json={"usuario": " Usuario ", "contrasena": "contrasena-segura-123"},
            )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.json, {"usuario": "usuario"})
        consulta_login, valores_login = next(
            (consulta, valores)
            for consulta, valores in cursor.consultas
            if "SELECT id_usuario, usuario, contrasena_hash" in consulta
        )
        self.assertIn("usuario = %s OR correo = %s", consulta_login)
        self.assertEqual(valores_login, ("usuario", "usuario"))
        with self.cliente:
            self.cliente.get("/api/auth/me")
            self.assertEqual(self.cliente.get("/api/auth/me").json, {"usuario": "usuario"})

    def test_login_acepta_correo_electronico(self):
        from werkzeug.security import generate_password_hash

        cursor = CursorFalso(
            registro={
                "id_usuario": 7,
                "usuario": "usuario",
                "contrasena_hash": generate_password_hash("contrasena-segura-123"),
            }
        )
        conexion = ConexionFalsa(cursor)
        with patch.object(api, "conectar", return_value=conexion):
            respuesta = self.cliente.post(
                "/api/auth/login",
                json={
                    "usuario": " Cesar@Correo.COM ",
                    "contrasena": "contrasena-segura-123",
                },
            )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.json, {"usuario": "usuario"})
        _, valores_login = next(
            (consulta, valores)
            for consulta, valores in cursor.consultas
            if "SELECT id_usuario, usuario, contrasena_hash" in consulta
        )
        self.assertEqual(valores_login, ("cesar@correo.com", "cesar@correo.com"))

    def test_login_rechaza_credenciales_incorrectas(self):
        from werkzeug.security import generate_password_hash

        cursor = CursorFalso(
            registro={
                "id_usuario": 7,
                "usuario": "usuario",
                "contrasena_hash": generate_password_hash("contrasena-correcta"),
            }
        )
        conexion = ConexionFalsa(cursor)
        with patch.object(api, "conectar", return_value=conexion):
            respuesta = self.cliente.post(
                "/api/auth/login",
                json={"usuario": "usuario", "contrasena": "contrasena-incorrecta"},
            )

        self.assertEqual(respuesta.status_code, 401)
        self.assertEqual(
            respuesta.json["error"],
            "Usuario o contraseña incorrectos.",
        )

    def test_inventario_requiere_inicio_de_sesion(self):
        respuesta = self.cliente.get("/api/productos")

        self.assertEqual(respuesta.status_code, 401)


if __name__ == "__main__":
    unittest.main()
