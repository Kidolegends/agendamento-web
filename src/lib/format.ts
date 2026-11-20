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

const dateOnlyFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE });

/** "YYYY-MM-DD" of an instant, in the business time zone. */
export const toBusinessDate = (iso: string | Date) => dateOnlyFormat.format(new Date(iso));

/** Today as "YYYY-MM-DD" in the business time zone (used as the min of the date input). */
export const todayInBusinessZone = (now = new Date()) => dateOnlyFormat.format(now);
