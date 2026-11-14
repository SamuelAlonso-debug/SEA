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
