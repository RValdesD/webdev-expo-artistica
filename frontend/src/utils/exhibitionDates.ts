import type { Exhibition } from '../types/exhibition';

const dateFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santiago' });

// "12 jun 2027 – 31 jul 2027"; si falta una fecha, se muestra solo la otra.
export function dateRange(item: Pick<Exhibition, 'startDate' | 'endDate'>): string {
  const start = item.startDate ? dateFormatter.format(new Date(item.startDate)) : '';
  const end = item.endDate ? dateFormatter.format(new Date(item.endDate)) : '';
  return start && end ? `${start} – ${end}` : start ? `Desde el ${start}` : end ? `Hasta el ${end}` : '';
}
