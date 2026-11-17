export interface Product {
  productId?: number;
  name: string;
  description: string;
  unitPrice: number;
  stock: number;
  status: 'A' | 'I'; // A = Active, I = Inactive
  registrationDate?: string;

  categoryName: string;
  supplierName: string;
  brandName: string;

  categoryId?: number;
  supplierId?: number;
  brandId?: number;
}
