import re


PATRON_CORREO = re.compile(
    r"[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@"
    r"[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?"
    r"(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+",
    re.IGNORECASE,
)


def normalizar_correo(correo):
    if not isinstance(correo, str):
        raise ValueError("El correo electrónico es obligatorio.")

    correo = correo.strip().lower()
    if (
        len(correo) > 254
        or not PATRON_CORREO.fullmatch(correo)
        or len(correo.split("@", maxsplit=1)[0]) > 64
        or correo.split("@", maxsplit=1)[0].startswith(".")
        or correo.split("@", maxsplit=1)[0].endswith(".")
        or ".." in correo.split("@", maxsplit=1)[0]
    ):
        raise ValueError("Ingresa un correo electrónico válido.")

    return correo


def asegurar_tabla_usuarios(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS Usuario (
            id_usuario INT AUTO_INCREMENT PRIMARY KEY,
            usuario VARCHAR(50) NOT NULL UNIQUE,
            correo VARCHAR(254) NOT NULL UNIQUE,
            contrasena_hash VARCHAR(255) NOT NULL,
            creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cursor.execute(
        """
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'Usuario'
          AND COLUMN_NAME = 'correo'
        """
    )
    if not cursor.fetchone():
        cursor.execute(
            """
            ALTER TABLE Usuario
            ADD COLUMN correo VARCHAR(254) NULL,
            ADD UNIQUE KEY uq_usuario_correo (correo)
            """
        )
