import { axiosClient } from '@/lib/http/client';
import type { InventoryResponse, CreateInventoryRequest } from '@erp/api-types';

export interface UpdateThresholdsRequest {
  productId:    string;
  warehouseId:  string;
  minQuantity:  number | null;
  maxQuantity:  number | null;
}

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

  // Standalone threshold edit (gateway proxies to PUT /inventory/thresholds).
  // null on either field means "leave the existing value alone".
  updateThresholds: async (body: UpdateThresholdsRequest): Promise<InventoryResponse> => {
    const res = await axiosClient.put<InventoryResponse>('/stock/thresholds', body);
    return res.data;
  },
};
