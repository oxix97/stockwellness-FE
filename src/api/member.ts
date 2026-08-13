import { apiClient } from "./client";

export interface MemberProfile {
  memberId: number;
  email: string;
  nickname: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "ACTIVE" | "DEACTIVATED";
  joinedDate: string;
}

export interface NotificationSettings {
  rebalancing: boolean;
  marketAlert: boolean;
  newListing: boolean;
}

export const memberKeys = {
  all: ["member"] as const,
  me: (memberId: number | null) => [...memberKeys.all, "me", memberId] as const,
  notifications: (memberId: number | null) => [...memberKeys.all, "notifications", memberId] as const,
};

export const memberApi = {
  getMe: async (): Promise<MemberProfile> => {
    const data = await apiClient.get<MemberProfile>("/v1/members/me");
    return data;
  },

  updateProfile: async (nickname: string): Promise<void> => {
    await apiClient.put("/v1/members/me", { nickname });
  },

  withdraw: async (): Promise<void> => {
    await apiClient.delete("/v1/members/me");
  },

  getNotifications: async (): Promise<NotificationSettings> => {
    const data = await apiClient.get<NotificationSettings>("/v1/members/me/notifications");
    return data;
  },

  updateNotifications: async (settings: Partial<NotificationSettings>): Promise<void> => {
    await apiClient.put("/v1/members/me/notifications", settings);
  },
};
