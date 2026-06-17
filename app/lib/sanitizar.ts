export const sanitizarTexto = (texto: string): string => {
  return texto
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
}

export const sanitizarNumero = (valor: string): number => {
  return parseInt(valor.replace(/[^0-9]/g, '')) || 0
}

export const sanitizarPrecio = (valor: string): number => {
  return parseInt(valor.replace(/\./g, '').replace(/[^0-9]/g, '')) || 0
}
