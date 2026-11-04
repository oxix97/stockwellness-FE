import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memberApi, memberKeys, NotificationSettings } from "@/api/member";
import { useAuthStore } from "@/store/auth";

export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const memberId = useAuthStore((s) => s.memberId);

  return useQuery({
    queryKey: memberKeys.me(memberId),
    queryFn: () => memberApi.getMe(),
    enabled: !!accessToken && memberId !== null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useNotificationSettings() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const memberId = useAuthStore((s) => s.memberId);

  return useQuery({
    queryKey: memberKeys.notifications(memberId),
    queryFn: () => memberApi.getNotifications(),
    enabled: !!accessToken && memberId !== null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateNotifications() {
  const queryClient = useQueryClient();
  const memberId = useAuthStore((s) => s.memberId);

  return useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) =>
      memberApi.updateNotifications(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.notifications(memberId) });
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
