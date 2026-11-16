import { Request, Response } from "express";
import { createProductSchema, updateProductSchema, stockEntrySchema } from "./product.schema";
import {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  activateProduct,
  getProductByCode,
  addStock,
} from "./product.service";
import { present } from "./product.margin";

// Sin try/catch: Express 5 lleva los errores (Zod, dominio, BD) al middleware central.
// `req.params.id` llega validado como ObjectId por router.param.

export const createProductHandler = async (req: Request, res: Response) => {
  const product = await createProduct(createProductSchema.parse(req.body));
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
  const product = await addStock(req.params.id, stockEntrySchema.parse(req.body));
  res.status(200).json(present(product));
};
