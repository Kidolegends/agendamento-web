export const TIMEZONE: string = import.meta.env.VITE_TIMEZONE ?? 'America/Sao_Paulo';

const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: TIMEZONE,
});
const timeFormat = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIMEZONE,
});
const currencyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));
export const formatTime = (iso: string) => timeFormat.format(new Date(iso));

/** The API stores prices in cents (integers), so we only divide when displaying. */
export const formatPrice = (cents: number) => currencyFormat.format(cents / 100);

/** Today as "YYYY-MM-DD" in the business time zone (used as the min of the date input). */
export function todayInBusinessZone(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(now);
}
