import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memberApi, NotificationSettings } from "@/api/member";
import { useAuthStore } from "@/store/auth";

export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setNickname = useAuthStore((s) => s.setNickname);

  return useQuery({
    queryKey: ["member", "me"],
    queryFn: async () => {
      const data = await memberApi.getMe();
      setNickname(data.nickname);
      return data;
    },
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
