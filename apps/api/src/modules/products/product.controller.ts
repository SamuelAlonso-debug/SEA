import { Request, Response } from "express";
import {
  createProductSchema,
  updateProductSchema,
  stockEntrySchema,
  activateProductSchema,
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
  ProductError,
} from "./product.service";
import { present } from "./product.margin";
import { z } from "zod";
import multer from "multer";
import { IMPORT_HEADERS, IMPORT_MAX_BYTES, ImportError, importProducts } from "./product.import";

export const createProductHandler = async (req: Request, res: Response) => {
  try {
    const parsed = createProductSchema.parse(req.body);
    const product = await createProduct(parsed);
    return res.status(201).json(present(product, true));
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: error.issues,
      });
    }

    if (error instanceof ProductError) {
      return res.status(error.status).json({ message: error.message });
    }

    return res
      .status(400)
      .json({ message: error.message || "Error al crear producto" });
  }
};

export const listProductsHandler = async (req: Request, res: Response) => {
  try {
    const products = await listProducts();
    return res.status(200).json(products.map((p) => present(p)));
  } catch {
    return res.status(500).json({ message: "Error al obtener productos" });
  }
};

export const getProductHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // 👈 forzamos a string

    if (!id) {
      return res.status(400).json({ message: "El id es requerido" });
    }

    const product = await getProductById(id);
    return res.status(200).json(present(product));
  } catch (error: any) {
    return res
      .status(404)
      .json({ message: error.message || "Producto no encontrado" });
  }
};

export const updateProductHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({ message: "El id es requerido" });
    }

    const parsed = updateProductSchema.parse(req.body);
    const product = await updateProduct(id, parsed);
    return res.status(200).json(present(product, true));
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: error.issues,
      });
    }

    if (error instanceof ProductError) {
      return res.status(error.status).json({ message: error.message });
    }

    return res
      .status(400)
      .json({ message: error.message || "Error al actualizar producto" });
  }
};

export const deleteProductHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({ message: "El id es requerido" });
    }

    const product = await deleteProduct(id);
    return res.status(200).json(present(product));
  } catch (error: any) {
    return res
      .status(400)
      .json({ message: error.message || "Error al eliminar producto" });
  }
};

export const activateProductHandler = async (req: Request, res: Response) => {
  const parsed = activateProductSchema.safeParse({ params: req.params });
  if (!parsed.success) {
    return res.status(400).json({ message: "Errores de validación", errors: parsed.error.issues });
  }
  try {
    const product = await activateProduct(parsed.data.params.id);
    return res.status(200).json(present(product));
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getProductByCodeHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const productCode = req.params.productCode as string;

    const product = await getProductByCode(productCode);

    return res.json(present(product));
  } catch (error: any) {
    return res.status(404).json({
      message: error.message ?? "Producto no encontrado",
    });
  }
};
export const addStockHandler = async (req: Request, res: Response) => {
  try {
    const parsed = stockEntrySchema.parse(req.body);
    const product = await addStock(req.params.id as string, parsed);
    return res.status(200).json(present(product));
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Datos inválidos", errors: error.issues });
    }
    if (error instanceof ProductError) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error al registrar la entrada de stock" });
  }
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
