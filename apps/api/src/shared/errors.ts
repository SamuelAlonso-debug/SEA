// Errores de dominio: el middleware central responde con su código y su mensaje tal cual.
export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message);
  }
}
