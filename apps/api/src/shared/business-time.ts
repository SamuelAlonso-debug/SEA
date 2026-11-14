// Día y mes del negocio en su zona horaria (IANA), no en la del proceso (UTC en Docker).
const zone = process.env.BUSINESS_TIMEZONE;

if (!zone) {
  throw new Error("BUSINESS_TIMEZONE no está definido");
}
try {
  new Intl.DateTimeFormat("es-MX", { timeZone: zone });
} catch {
  throw new Error(`BUSINESS_TIMEZONE inválido: ${zone}`);
}

export const BUSINESS_TIMEZONE = zone;

function wallClock(t: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(t);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

// Desfase de la zona respecto a UTC en el instante t, en ms.
function offset(t: number, timeZone: string) {
  const w = wallClock(t, timeZone);
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - Math.floor(t / 1000) * 1000;
}

// Medianoche local → instante UTC. Doble paso para cambios de horario. Date.UTC normaliza desbordes (día 32, mes 13).
function midnight(year: number, month: number, day: number, timeZone: string) {
  const guess = Date.UTC(year, month - 1, day);
  return new Date(guess - offset(guess - offset(guess, timeZone), timeZone));
}

// `month` 1-12.
export function businessRanges(now: Date, timeZone: string = BUSINESS_TIMEZONE) {
  const { year, month, day } = wallClock(now.getTime(), timeZone);
  return {
    year,
    month,
    startOfToday: midnight(year, month, day, timeZone),
    startOfTomorrow: midnight(year, month, day + 1, timeZone),
    startOfMonth: midnight(year, month, 1, timeZone),
    startOfNextMonth: midnight(year, month + 1, 1, timeZone),
  };
}

// Periodo de fechas del negocio, inclusivo: "AAAA-MM-DD".
export interface Period {
  from: string;
  to: string;
}

const DAY_MS = 86_400_000;
const utcDay = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y!, m! - 1, d!);
};
const formatDay = (t: number) => new Date(t).toISOString().slice(0, 10);

export const periodDays = ({ from, to }: Period) => (utcDay(to) - utcDay(from)) / DAY_MS + 1;

// [start, end) en UTC; year y month (1-12) del inicio.
export function rangeOf({ from, to }: Period, timeZone: string = BUSINESS_TIMEZONE) {
  const [y, m, d] = from.split("-").map(Number) as [number, number, number];
  const [ty, tm, td] = to.split("-").map(Number) as [number, number, number];
  return { start: midnight(y, m, d, timeZone), end: midnight(ty, tm, td + 1, timeZone), year: y, month: m };
}
export type Range = ReturnType<typeof rangeOf>;

export function currentMonth(now: Date = new Date(), timeZone: string = BUSINESS_TIMEZONE): Period {
  const { year, month } = businessRanges(now, timeZone);
  return { from: formatDay(Date.UTC(year, month - 1, 1)), to: formatDay(Date.UTC(year, month, 0)) };
}

// Periodo anterior de igual duración. Meses completos → mismos meses anteriores (oct → sep).
export function previousPeriod(period: Period): Period {
  const start = utcDay(period.from);
  const next = new Date(utcDay(period.to) + DAY_MS);
  const first = new Date(start);
  if (first.getUTCDate() === 1 && next.getUTCDate() === 1) {
    const months = (next.getUTCFullYear() - first.getUTCFullYear()) * 12 + next.getUTCMonth() - first.getUTCMonth();
    return { from: formatDay(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - months, 1)), to: formatDay(start - DAY_MS) };
  }
  return { from: formatDay(start - periodDays(period) * DAY_MS), to: formatDay(start - DAY_MS) };
}

// Variación porcentual a 2 decimales; null si el periodo anterior es 0.
export const percentChange = (current: number, previous: number) =>
  previous === 0 ? null : Math.round(((current - previous) / previous) * 10_000) / 100;
