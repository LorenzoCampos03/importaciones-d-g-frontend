export interface SaleDetail {
  saleDetailId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productId: number;
  productName: string;
  productDescription: string;
  saleId: number | null;
}
export interface Sale {
  saleId: number;
  saleDate: string;
  total: number;
  status: string;
  paymentMethod: string;
  deliveryMethod: string;
  deliveryAddress: string | null;
  clientId: number;
  clientName: string;
  employeeId: number;
  employeeName: string;
  officeId: number;
  officeName: string;
  saleDetails: SaleDetail[];
}
export interface SaleSummary {
  totalSales: number;
  totalRevenue: number;
  salesByStatus: {
    paid: number;
    pending: number;
    shipped: number;
    cancelled: number;
  };
}

export interface SellerDashboardData {
  totalProducts: number;
  totalSales: number;
  todayRevenue: number;
  pendingSales: number;
  completedSales: number;
  clientsServed: number;
  monthlyTarget: number;
  dailyTarget: number;
}

export interface EmployeeSalesSummary {
  totalSales: number;
  totalRevenue: number;
  todayRevenue: number;
  todaySales: number;
  salesByStatus: {
    paid: number;
    pending: number;
    shipped: number;
    cancelled: number;
  };
  uniqueClientsServed: number;
}
