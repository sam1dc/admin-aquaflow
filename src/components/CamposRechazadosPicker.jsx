import React from 'react';

// Lo que el conductor tendrá que reenviar desde la app. Las claves son las de
// CAMPOS_RECHAZABLES en backend-aquaflow/src/lib/rechazos.ts.
export const CAMPOS_RECHAZABLES = [
  { id: 'documento_identidad', label: 'Foto de la cédula' },
  { id: 'licencia_documento', label: 'Foto de la licencia' },
  { id: 'foto_vehiculo', label: 'Foto del vehículo' },
  { id: 'foto_perfil', label: 'Foto de perfil' },
  { id: 'datos_personales', label: 'Datos personales' },
  { id: 'datos_vehiculo', label: 'Datos del vehículo' },
];

/**
 * Casillas para marcar qué debe reenviar el usuario. La app le pide solo eso y
 * se lo nombra en la notificación; sin marcar nada le deja corregir todo.
 */
export const CamposRechazadosPicker = ({ value, onChange, opciones = CAMPOS_RECHAZABLES }) => {
  const toggle = (id) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  // Una solicitud que solo cambia, p. ej., el teléfono no tiene nada que marcar.
  if (opciones.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-text-muted mb-2">¿Qué debe volver a enviar?</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {opciones.map(({ id, label }) => (
          <label key={id} className="flex items-center gap-2 text-sm text-text-main cursor-pointer select-none">
            <input
              type="checkbox"
              checked={value.includes(id)}
              onChange={() => toggle(id)}
              className="accent-status-error w-4 h-4 cursor-pointer"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
};
