import { Router } from "express";
import { authMiddleware } from "../../shared/auth.middleware";
import {
  listClientsHandler,
  getClientHandler,
  createClientHandler,
  updateClientHandler,
  deleteClientHandler,
  activateClientHandler,
  getClientSalesHandler,
} from "./client.controller";

const router = Router();

// Proteger todas las rutas de clientes
router.use(authMiddleware);

// GET /api/clients?search=&page=&pageSize=
router.get("/", listClientsHandler);

// GET /api/clients/:id
router.get("/:id", getClientHandler);

// POST /api/clients
router.post("/", createClientHandler);

// PUT /api/clients/:id
router.put("/:id", updateClientHandler);

// DELETE /api/clients/:id (baja lógica)
router.delete("/:id", deleteClientHandler);

// PATCH /api/clients/:id/activate
router.patch("/:id/activate", activateClientHandler);

// (Opcional / futuro) GET /api/clients/:id/sales
router.get("/:id/sales", getClientSalesHandler);

export default router;
