"""Valores permitidos para permisos RBAC (alineado con seed_admin y frontend)."""

PROCESOS_PERMITIDOS = frozenset(
    {
        "crear",
        "editar",
        "eliminar",
        "asignar",
        "confirmar_horario",
        "procesar_horario",
        "editar_horarios_confirmados",
        "editar_turnos_personal_confirmado",
    }
)

VENTANAS_PERMITIDAS = frozenset(
    {
        "reportes",
        "usuarios",
        "roles",
        "permisos",
        "proyecto",
        "turno",
        "tipo_pasajero",
        "tipo_vehiculo",
        "pasajero",
        "conductor",
        "vehiculo",
        "ruta",
        "horarios",
        "turnos_personal",
        "demanda_viajes",
    }
)
