"""Valores permitidos para permisos RBAC (alineado con seed_admin y frontend)."""

PROCESOS_PERMITIDOS = frozenset({"crear", "editar", "eliminar", "asignar"})

VENTANAS_PERMITIDAS = frozenset(
    {
        "dashboard",
        "usuarios",
        "roles",
        "permisos",
        "proyecto",
        "turno",
        "tipo_pasajero",
        "pasajero",
        "conductor",
        "vehiculo",
        "ruta",
        "horarios",
    }
)
