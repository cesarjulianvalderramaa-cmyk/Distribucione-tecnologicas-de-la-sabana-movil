import importlib.util
import os

import mysql.connector
from mysql.connector import Error


def conectar():
    try:
        if importlib.util.find_spec("conexion"):
            from conexion import conectar as conectar_local

            return conectar_local()

        password = os.environ.get("MYSQL_PASSWORD")
        if not password:
            raise RuntimeError(
                "Configura MYSQL_PASSWORD en el entorno para conectar con MySQL."
            )

        conexion = mysql.connector.connect(
            host=os.environ.get("MYSQL_HOST", "localhost"),
            port=int(os.environ.get("MYSQL_PORT", "3306")),
            user=os.environ.get("MYSQL_USER", "root"),
            password=password,
            database=os.environ.get(
                "MYSQL_DATABASE",
                "distribuciones_tecnologicas_sabana",
            ),
        )

        if conexion.is_connected():
            print("Conexión a MySQL exitosa")
            return conexion
    except (Error, RuntimeError, ValueError) as error:
        print("Error al conectar a MySQL:", error)

    return None
