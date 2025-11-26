export interface CreateProductDto {
  name: string;
  productCode: string;
  category?: string | null;
  price: number;
  stock: number;
  provider?: string | null;
  imageUrl?: string | null;
}

export interface UpdateProductDto {
  name?: string;
  productCode?: string;
  category?: string | null;
  price?: number;
  stock?: number;
  provider?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
