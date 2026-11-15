import { Request, Response } from "express";
import {
  createProductSchema,
  updateProductSchema,
  stockEntrySchema,
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
  try {
    const id = req.params.id as string;

    const product = await activateProduct(id);
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
