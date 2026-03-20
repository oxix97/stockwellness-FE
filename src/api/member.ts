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

export const memberApi = {
  getMe: () =>
    apiClient.get<MemberProfile>("/v1/members/me"),

  updateProfile: (nickname: string) =>
    apiClient.put<void>("/v1/members/me", { nickname }),

  withdraw: () =>
    apiClient.delete<void>("/v1/members/me"),

  getNotifications: () =>
    apiClient.get<NotificationSettings>("/v1/members/me/notifications"),

  updateNotifications: (settings: Partial<NotificationSettings>) =>
    apiClient.put<void>("/v1/members/me/notifications", settings),
};
