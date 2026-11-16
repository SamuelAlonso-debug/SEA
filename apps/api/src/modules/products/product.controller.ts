import { Request, Response } from "express";
import {
  createProductSchema,
  updateProductSchema,
  stockEntrySchema,
  stockMovementSchema,
  movementsQuerySchema,
} from "./product.schema";
import {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  activateProduct,
  getProductByCode,
  addStock,
  createMovement,
  listMovements,
} from "./product.service";
import { present } from "./product.margin";
import { z } from "zod";
import multer from "multer";
import { IMPORT_HEADERS, IMPORT_MAX_BYTES, ImportError, importProducts } from "./product.import";
import { AuthRequest } from "../../shared/auth.middleware";

// Sin try/catch: Express 5 lleva los errores (Zod, dominio, BD) al middleware central.
// `req.params.id` llega validado como ObjectId por router.param.

export const createProductHandler = async (req: Request, res: Response) => {
  const product = await createProduct(createProductSchema.parse(req.body), (req as AuthRequest).userId);
  res.status(201).json(present(product, true));
};

export const listProductsHandler = async (req: Request, res: Response) => {
  const products = await listProducts();
  res.status(200).json(products.map((p) => present(p)));
};

export const getProductHandler = async (req: Request<{ id: string }>, res: Response) => {
  res.status(200).json(present(await getProductById(req.params.id)));
};

export const updateProductHandler = async (req: Request<{ id: string }>, res: Response) => {
  const product = await updateProduct(req.params.id, updateProductSchema.parse(req.body));
  res.status(200).json(present(product, true));
};

export const deleteProductHandler = async (req: Request<{ id: string }>, res: Response) => {
  res.status(200).json(present(await deleteProduct(req.params.id)));
};

export const activateProductHandler = async (req: Request<{ id: string }>, res: Response) => {
  res.status(200).json(present(await activateProduct(req.params.id)));
};

export const getProductByCodeHandler = async (req: Request<{ productCode: string }>, res: Response) => {
  res.json(present(await getProductByCode(req.params.productCode)));
};

export const addStockHandler = async (req: Request<{ id: string }>, res: Response) => {
  const product = await addStock(req.params.id, stockEntrySchema.parse(req.body), (req as AuthRequest).userId);
  res.status(200).json(present(product));
};

export const createMovementHandler = async (req: Request<{ id: string }>, res: Response) => {
  const product = await createMovement(req.params.id, stockMovementSchema.parse(req.body), (req as AuthRequest).userId);
  res.status(201).json(present(product));
};

export const listMovementsHandler = async (req: Request<{ id: string }>, res: Response) => {
  res.status(200).json(await listMovements(req.params.id, movementsQuerySchema.parse(req.query)));
};

// En memoria: el límite de 1 MB acota el uso; el archivo nunca se escribe a disco.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: IMPORT_MAX_BYTES, files: 1 } }).single("file");

export const importTemplateHandler = (_req: Request, res: Response) => {
  res.type("text/csv").attachment("plantilla-productos.csv").send(IMPORT_HEADERS.join(",") + "\r\n");
};

export const importProductsHandler = (req: Request, res: Response) => {
  upload(req, res, async (uploadError: any) => {
    try {
      if (uploadError?.code === "LIMIT_FILE_SIZE") throw new ImportError(413, "El archivo supera 1 MB");
      if (uploadError) throw new ImportError(400, "Selecciona un archivo CSV");
      if (!req.file) throw new ImportError(400, "Selecciona un archivo CSV");
      const dryRun = z.enum(["true", "false"]).default("false").safeParse(req.query.dryRun);
      if (!dryRun.success) throw new ImportError(400, "dryRun debe ser true o false");

      const result = await importProducts(req.file.buffer, dryRun.data === "true");
      return res.status("created" in result ? 201 : 200).json(result);
    } catch (error: any) {
      if (error instanceof ImportError) {
        return res.status(error.status).json({ message: error.message, ...(error.rows && { rows: error.rows }) });
      }
      return res.status(500).json({ message: "Error al importar productos" });
    }
  });
};
