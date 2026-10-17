import getpass
import re

from werkzeug.security import generate_password_hash

from conexion import conectar
from usuarios import asegurar_tabla_usuarios


def crear_usuario():
    usuario = input("Nombre de usuario: ").strip().lower()
    if not re.fullmatch(r"[a-z0-9._-]{3,50}", usuario):
        raise ValueError(
            "El usuario debe tener entre 3 y 50 caracteres: letras, números, punto, guion o guion bajo."
        )

    contrasena = getpass.getpass("Contraseña (mínimo 12 caracteres): ")
    confirmacion = getpass.getpass("Confirma la contraseña: ")
    if len(contrasena) < 12:
        raise ValueError("La contraseña debe tener al menos 12 caracteres.")
    if contrasena != confirmacion:
        raise ValueError("Las contraseñas no coinciden.")

    conexion = conectar()
    if not conexion:
        raise RuntimeError("No fue posible conectar con la base de datos.")

    cursor = None
    try:
        cursor = conexion.cursor()
        asegurar_tabla_usuarios(cursor)
        cursor.execute(
            "INSERT INTO Usuario (usuario, contrasena_hash) VALUES (%s, %s)",
            (usuario, generate_password_hash(contrasena)),
        )
        conexion.commit()
        print(f"Usuario '{usuario}' creado correctamente.")
    except Exception:
        conexion.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        conexion.close()


if __name__ == "__main__":
    try:
        crear_usuario()
    except (RuntimeError, ValueError) as error:
        print(f"Error: {error}")
        raise SystemExit(1) from error
