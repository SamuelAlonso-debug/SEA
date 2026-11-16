import { CaughtError } from "./caught-error";
// Mongo aborta la transacción ante un conflicto de escritura (P2034) o un alta
// simultánea de un registro único (P2002): se reintenta con espera aleatoria creciente.
const RETRY_CODES = ["P2034", "P2002"];
const MAX_ATTEMPTS = 50;

export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = MAX_ATTEMPTS): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (caught) {
      const error = caught as CaughtError;
      if (!error?.code || !RETRY_CODES.includes(error.code) || attempt >= maxAttempts) throw error;
      await new Promise((r) => setTimeout(r, Math.random() * 10 * attempt));
    }
  }
}
