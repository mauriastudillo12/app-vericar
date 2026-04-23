// Utilidad para convertir códigos de región al nombre legible
// Usada en tarjetas, detalles y feeds de toda la app

export const NOMBRES_REGIONES: Record<string, string> = {
  '15': 'Arica y Parinacota',
  '01': 'Tarapacá',
  '02': 'Antofagasta',
  '03': 'Atacama',
  '04': 'Coquimbo',
  '05': 'Valparaíso',
  '13': 'Metropolitana',
  '06': "O'Higgins",
  '07': 'Maule',
  '16': 'Ñuble',
  '08': 'Biobío',
  '09': 'La Araucanía',
  '14': 'Los Ríos',
  '10': 'Los Lagos',
  '11': 'Aysén',
  '12': 'Magallanes',
}

// Función que recibe el código y devuelve el nombre
// Si el código no existe, devuelve el mismo valor recibido
export const getNombreRegion = (codigo: string) => {
  return NOMBRES_REGIONES[codigo] || codigo
}