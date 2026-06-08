export interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt?: string;
}

export interface Rider {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  vehicle: string;
  isOnline: boolean;
  rating: number;
  totalTrips: number;
  user: {
    name: string;
    phone: string;
    email?: string;
    createdAt: string;
  };
}

export interface Order {
  id: string;
  customerId: string;
  riderId?: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm: number;
  price: number;
  status: 'REQUESTED' | 'ACCEPTED' | 'PICKED' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: 'CASH' | 'CARD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  createdAt: string;
  customer?: { name: string; phone: string };
  rider?: { user: { name: string; phone: string }; vehicle: string; rating: number };
}

export interface Analytics {
  orders: {
    total: number;
    completed: number;
    active: number;
    cancelled: number;
  };
  users: {
    customers: number;
    approvedRiders: number;
    pendingRiders: number;
  };
  revenue: {
    totalDeliveryValue: number;
    platformEarnings: number;
    currency: string;
  };
}