/**
 * Convierte una cadena de texto en el formato dd-mm-yyyy a un objeto Date.
 * @param dateString - La cadena de texto con la fecha en formato dd-mm-yyyy.
 * @returns Un objeto Date.
 */
export function parseDate(dateString: string | undefined): Date {
  if (!dateString) {
    return new Date();
  }
  if (dateString.includes('-')) {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
}