// Contrato de los servicios; los schemas Zod lo satisfacen (satisfies).
export interface CreateProductDto {
  name: string;
  productCode: string;
  category?: string | null | undefined;
  price: number;
  cost: number;
  stock: number;
  provider?: string | null | undefined;
  imageUrl?: string | null | undefined;
  minStock?: number | undefined;
}

export interface UpdateProductDto {
  name?: string | undefined;
  productCode?: string | undefined;
  category?: string | null | undefined;
  price?: number | undefined;
  cost?: number | undefined;
  provider?: string | null | undefined;
  imageUrl?: string | null | undefined;
  minStock?: number | undefined;
  isActive?: boolean | undefined;
}

export interface ProductDto {
  id: string;
  name: string;
  productCode: string;
  category?: string | null;
  price: number;
  stock: number;
  provider?: string | null;
  imageUrl?: string | null;
  minStock?: number | null;
  cost?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
