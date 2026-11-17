import { PurchaseDetail } from './purchase-detail.interface';

export interface Purchase {
  purchaseId?: number;
  employeeId: number;
  supplierId: number;
  userName?: string;
  purchaseDate: string;
  status: PurchaseStatus;
  totalCost: number;
  purchaseDetails: PurchaseDetail[];
}

export type PurchaseStatus = 'Pendiente' | 'Pagado' | 'Recibido' | 'Cancelado';

export type { PurchaseDetail };
