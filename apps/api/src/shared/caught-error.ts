// Forma mínima de lo que los controladores leen de un error capturado (que llega como unknown).
export type CaughtError = { name?: string; message?: string; issues?: unknown; code?: string };
