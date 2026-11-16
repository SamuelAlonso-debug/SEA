import { Router } from "express";
import { authMiddleware } from "../../shared/auth.middleware";
import { validateId } from "../../shared/error-handler";
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

// ADMIN y CASHIER: caja registra y consulta clientes al cobrar.
router.use(authMiddleware);

router.param("id", validateId);

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

// GET /api/clients/:id/sales
router.get("/:id/sales", getClientSalesHandler);

export default router;
