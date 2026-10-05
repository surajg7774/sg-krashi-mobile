// Matches com.sgkrashi.notification's real entity/DTOs exactly.
export type NotificationType =
  | "ORDER_PLACED"
  | "ORDER_CONFIRMED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "PAYMENT_FAILED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_COMPLETED"
  | "INQUIRY_STATUS_CHANGED"
  | "REFUND_PROCESSED"
  | "WEATHER_ADVISORY"
  | "PAYOUT_APPROVED"
  | "PAYOUT_PAID";

export type NotificationRelatedType = "ORDER" | "BOOKING" | "INQUIRY" | "FARMER_PROFILE" | "PAYOUT";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  relatedType: NotificationRelatedType | null;
  relatedId: number | null;
  createdAt: string;
}

export interface NotificationListResult {
  items: AppNotification[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  unreadCount: number;
}

export type DevicePlatform = "ANDROID" | "IOS";
