// DTOs mirroring backend response shapes exactly.
// Source of truth: service controllers + mobile-gateway route comments.

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  id:    string;
  email: string;
  name:  string;
  role:  string;
}

export interface LoginRequest {
  email:    string;
  password: string;
}

export interface RegisterRequest {
  name:     string;
  email:    string;
  password: string;
  role:     string;
}

// Decoded JWT payload (jwt-decode output)
export interface JwtPayload {
  sub:    string;   // email
  role:   string;   // 'MANAGER' | 'WORKER'
  userId: string;
  iat:    number;
  exp:    number;
}

// ─── Warehouses ──────────────────────────────────────────────────────────────

// Backend enums (warehouse-service/domain/enums/Country.java & City.java)
export const COUNTRIES = ['MACEDONIA', 'SLOVENIA'] as const;
export type Country = typeof COUNTRIES[number];

export const CITIES = ['MARIBOR', 'LJUBLJANA', 'KUMANOVO', 'SKOPJE'] as const;
export type City = typeof CITIES[number];

export interface WarehouseResponse {
  id:            string;
  name:          string;
  country:       Country;
  city:          City;
  totalCapacity: number;
  usedCapacity:  number;
}

// /warehouses/summary returns this shape (mobile-gateway rewrites to /warehouses/total)
export interface TotalWarehousesResponse {
  totalNumberOfWarehouses: number;
}

export interface CreateWarehouseRequest {
  name:          string;
  country:       Country;
  city:          City;
  totalCapacity: number;
}

export interface UpdateWarehouseRequest {
  name:          string;
  country:       Country;
  city:          City;
  totalCapacity: number;
  usedCapacity:  number;
}

// ─── Inventory / Stock ───────────────────────────────────────────────────────

// Mobile-gateway serves /stock/* → downstream /inventory/*
export interface InventoryResponse {
  id:           string;
  productId:    string;
  warehouseId:  string;
  quantity:     number;
  // Gap 13: nullable thresholds. The mobile low-stock badge uses minQuantity
  // when set, else falls back to a UI default (10) for visibility.
  minQuantity?: number | null;
  maxQuantity?: number | null;
}

export interface CreateInventoryRequest {
  warehouseId:  string;
  productId:    string;
  quantity:     number;
  minQuantity?: number | null;
  maxQuantity?: number | null;
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface ProductResponse {
  id:          string;
  name:        string;
  sku:         string;
  description: string;
  weight:      number;
  categoryId:  string;
}

export interface CreateProductRequest {
  name:        string;
  sku:         string;
  description: string;
  weight:      number;
  categoryId:  string;
}

export interface UpdateProductRequest {
  name:        string;
  sku:         string;
  description: string;
  weight:      number;
  categoryId:  string;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface CategoryResponse {
  id:           string;
  name:         string;
  description?: string;
}

export interface CreateCategoryRequest {
  name:         string;
  description?: string;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

// Status values mirror order-service Domain/Enums/Status.cs
export type OrderStatus = 'Requested' | 'Approved' | 'Delivered' | 'Closed';

export interface OrderResponse {
  id:           string;
  productId:    string;
  companyId:    string;
  warehouseId:  string;
  driverId:     string;
  quantity:     number;
  status:       OrderStatus;
  deliveryDate: string | null;
  createdAt:    string;
  lastModified: string;
}

export interface CreateOrderRequest {
  productId:    string;
  companyId:    string;
  warehouseId:  string;
  driverId:     string;
  quantity:     number;
  deliveryDate?: string | null;
}

// Mobile uses PUT /orders/:id/status { status: number }
// Status numeric mapping matches the C# enum ordinal: Requested=0, Approved=1, Delivered=2, Closed=3
export const ORDER_STATUS_VALUES: Record<OrderStatus, number> = {
  Requested: 0,
  Approved:  1,
  Delivered: 2,
  Closed:    3,
};

// Inverse map — backend serialises the enum as a number on responses, so
// `ordersApi.getAll/create/updateStatus` normalises every response through
// this lookup before handing it to React Query.
export const ORDER_STATUS_NAMES: Record<number, OrderStatus> = {
  0: 'Requested',
  1: 'Approved',
  2: 'Delivered',
  3: 'Closed',
};

// ─── Companies ───────────────────────────────────────────────────────────────

export interface CompanyResponse {
  id:      string;
  name:    string;
  email:   string;
  phone:   string;
  contact: string;
}

export interface CreateCompanyRequest {
  name:    string;
  email:   string;
  phone:   string;
  contact: string;
}

export interface UpdateCompanyRequest {
  name:    string;
  email:   string;
  phone:   string;
  contact: string;
}

// ─── Fleet — Drivers ─────────────────────────────────────────────────────────

export interface DriverResponse {
  id:        string;
  name:      string;
  phone:     string;
  email:     string;
  vehicleId: string;
  companyId: string;
}

export interface CreateDriverRequest {
  name:      string;
  phone:     string;
  email:     string;
  vehicleId: string;
  companyId: string;
}

export interface UpdateDriverRequest {
  name:      string;
  phone:     string;
  email:     string;
  vehicleId: string;
  companyId: string;
}

// ─── Fleet — Vehicles ────────────────────────────────────────────────────────
// Backend (fleet-service/Domain/Entities/Vehicle.cs) carries only id +
// registrationPlate today. Type and companyId are not modelled — earlier
// mobile drafts that referenced them have been dropped.

export interface VehicleResponse {
  id:                string;
  registrationPlate: string;
}

export interface CreateVehicleRequest {
  registrationPlate: string;
}

export interface UpdateVehicleRequest {
  registrationPlate: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface NotificationResponse {
  id:        string;
  title:     string;
  body:      string;
  severity:  string;
  read:      boolean;
  createdAt: string;
}

// WebSocket message shape (notification-service ws-broadcaster)
export interface WsNotificationMessage {
  type:    string;
  topic?:  string;
  payload?: unknown;
}

// ─── Common ──────────────────────────────────────────────────────────────────

export interface ApiError {
  error:   string;
  message: string;
  status?: number;
}
