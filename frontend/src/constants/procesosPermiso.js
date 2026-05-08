/**
 * Procesos RBAC válidos (alineado con seed_admin y hasProceso en frontend).
 * value en minúsculas; el backend normaliza al guardar.
 */
export const PROCESOS_PERMISO_OPTIONS = [
  { value: 'crear', label: 'Crear' },
  { value: 'editar', label: 'Editar' },
  { value: 'eliminar', label: 'Eliminar' },
  { value: 'asignar', label: 'Asignar' },
  { value: 'confirmar_horario', label: 'Confirmar horario' },
  { value: 'procesar_horario', label: 'Procesar horario' },
  {
    value: 'editar_horarios_confirmados',
    label: 'Editar horarios confirmados',
  },
  {
    value: 'editar_turnos_personal_confirmado',
    label: 'Editar turnos personal (horario confirmado)',
  },
]
