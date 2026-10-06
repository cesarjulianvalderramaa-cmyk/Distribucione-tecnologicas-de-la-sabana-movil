from producto import (
    crear_producto,
    listar_productos,
    actualizar_producto,
    eliminar_producto
)


def mostrar_menu():
    print("\n========================================")
    print("   DISTRIBUCIONES DE LA SABANA")
    print("========================================")
    print("1. Crear producto")
    print("2. Listar productos")
    print("3. Actualizar producto")
    print("4. Eliminar producto")
    print("5. Salir")
    print("========================================")


while True:
    mostrar_menu()

    opcion = input("Seleccione una opción: ")

    if opcion == "1":
        print("\n--- CREAR PRODUCTO ---")

        nombre = input("Nombre: ")
        precio = float(input("Precio: "))
        stock = int(input("Stock: "))
        id_categoria = int(input("ID de categoría: "))

        crear_producto(
            nombre,
            precio,
            stock,
            id_categoria
        )

    elif opcion == "2":
        print("\n--- LISTA DE PRODUCTOS ---")
        listar_productos()

    elif opcion == "3":
        print("\n--- ACTUALIZAR PRODUCTO ---")

        id_producto = int(input("ID del producto: "))
        nombre = input("Nuevo nombre: ")
        precio = float(input("Nuevo precio: "))
        stock = int(input("Nuevo stock: "))
        id_categoria = int(input("ID de categoría: "))

        actualizar_producto(
            id_producto,
            nombre,
            precio,
            stock,
            id_categoria
        )

    elif opcion == "4":
        print("\n--- ELIMINAR PRODUCTO ---")

        id_producto = int(input("ID del producto: "))

        eliminar_producto(id_producto)

    elif opcion == "5":
        print("\nPrograma finalizado.")
        break

    else:
        print("\nOpción no válida. Intente nuevamente.")