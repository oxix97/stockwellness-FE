import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memberApi, NotificationSettings } from "@/api/member";
import { useAuthStore } from "@/store/auth";

export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: ["member", "me"],
    queryFn: () => memberApi.getMe(),
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });
}

export function useNotificationSettings() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: ["member", "notifications"],
    queryFn: () => memberApi.getNotifications(),
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) =>
      memberApi.updateNotifications(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member", "notifications"] });
    },
  });
}

export function useUpdateProfile() {
  const setNickname = useAuthStore((s) => s.setNickname);

  return useMutation({
    mutationFn: (nickname: string) => memberApi.updateProfile(nickname),
    onSuccess: (_, nickname) => {
      setNickname(nickname);
    },
  });
}

export function useWithdraw() {
  return useMutation({
    mutationFn: () => memberApi.withdraw(),
  });
}
