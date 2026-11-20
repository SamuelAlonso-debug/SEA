import { ErrorRequestHandler, RequestHandler, RequestParamHandler } from "express";
import { z, ZodError } from "zod";
import { HttpError } from "./errors";

const objectIdParams = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, "ID inválido") });

// router.param("id", validateId): un id que no es ObjectId responde 400 antes de llegar a Prisma.
export const validateId: RequestParamHandler = (req, res, next, id) => {
  objectIdParams.parse({ id });
  next();
};

export const routeNotFound: RequestHandler = (req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
};

// body-parser marca sus errores de cliente con `type` y `expose`; el resto no se muestra.
const BODY_MESSAGES: Record<string, string> = {
  "entity.parse.failed": "JSON inválido",
  "entity.too.large": "Cuerpo demasiado grande",
};

// Único punto de salida de errores: Express 5 trae aquí también los rechazos de handlers async.
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Respuesta ya empezada: solo Express puede cortar la conexión.
  if (res.headersSent) return next(err);
  if (err instanceof ZodError) {
    // Zod agrupa las claves desconocidas (schemas strict) en una issue: una por clave.
    const issues = err.issues.flatMap((i) =>
      i.code === "unrecognized_keys"
        ? i.keys.map((key) => ({ path: [...i.path, key].join("."), message: "Parámetro no permitido" }))
        : [{ path: i.path.join("."), message: i.message }]
    );
    return res.status(400).json({ message: "Datos inválidos", issues });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err?.expose && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: BODY_MESSAGES[err.type] ?? "Petición inválida" });
  }
  // Prisma, driver o bug: el detalle solo va al log del servidor.
  console.error(err);
  res.status(500).json({ message: "Error interno" });
};
