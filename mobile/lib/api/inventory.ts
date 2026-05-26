import { axiosClient } from '@/lib/http/client';
import type { InventoryResponse, CreateInventoryRequest } from '@/types/api';

// Mobile-gateway serves /stock/* and rewrites to /inventory/* downstream.
export const inventoryApi = {
  getAll: async (): Promise<InventoryResponse[]> => {
    const res = await axiosClient.get<InventoryResponse[]>('/stock');
    return res.data;
  },

  getByWarehouse: async (warehouseId: string): Promise<InventoryResponse[]> => {
    const res = await axiosClient.get<InventoryResponse[]>(`/stock/${warehouseId}`);
    return res.data;
  },

  addStock: async (body: CreateInventoryRequest): Promise<InventoryResponse> => {
    const res = await axiosClient.post<InventoryResponse>('/stock', body);
    return res.data;
  },
};
