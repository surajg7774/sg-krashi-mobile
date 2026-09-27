import { apiClient } from "@/api/client";
import type { AppNotification, DevicePlatform, NotificationListResult } from "./types";

// GET /notifications/my, PATCH /{id}/read, PATCH /read-all already existed
// on the backend before Phase E (built for a web notification bell that
// doesn't exist yet either) — reused as-is, not rebuilt, per the task's
// explicit instruction to check for an existing list endpoint first.
export const notificationService = {
  getMyNotifications: async (page: number, size = 20): Promise<NotificationListResult> => {
    const response = await apiClient.get<NotificationListResult>("/notifications/my", { params: { page, size } });
    return response.data;
  },

  markAsRead: async (id: number): Promise<AppNotification> => {
    const response = await apiClient.patch<AppNotification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch("/notifications/read-all");
  },

  registerDeviceToken: async (token: string, platform: DevicePlatform): Promise<void> => {
    await apiClient.post("/notifications/device-tokens", { token, platform });
  },

  unregisterDeviceToken: async (token: string): Promise<void> => {
    await apiClient.delete("/notifications/device-tokens", { params: { token } });
  },
};
