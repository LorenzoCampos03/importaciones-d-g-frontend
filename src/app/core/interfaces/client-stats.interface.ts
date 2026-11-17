export interface ClientStats {
  totalPurchases: number;
  totalSpent: number;
  pendingOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  lastPurchaseDate: string | null;
  recentPurchases: RecentPurchase[];
}

export interface RecentPurchase {
  saleId: number;
  saleDate: string;
  total: number;
  status: string;
  itemCount: number;
}

export interface ClientDashboardData {
  userInfo: {
    name: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    memberSince: string;
  };
  stats: ClientStats;
}
