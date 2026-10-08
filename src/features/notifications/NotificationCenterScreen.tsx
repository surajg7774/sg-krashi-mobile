import { useMemo } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { ICONS } from "@/theme/icons";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ListRowSkeletonList } from "@/components/Skeleton";
import { notificationService } from "./notificationService";
import { navigateToNotificationTarget } from "@/navigation/navigationRef";
import type { AppNotification } from "./types";
import type { TFunction } from "@/i18n";
import { shouldFetchNextPage } from "@/offline/screenState";
import { LoadMoreFooter } from "@/components/LoadMoreFooter";
import { useT } from "@/i18n/useT";

const PAGE_SIZE = 20;
export const NOTIFICATIONS_QUERY_KEY = ["notifications"];

const timeAgo = (iso: string, t: TFunction): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return t("notifications.justNow");
  if (minutes < 60) return t("notifications.minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("notifications.hoursAgo", { count: hours });
  return t("notifications.daysAgo", { count: Math.floor(hours / 24) });
};

// The title and message come from the server and are shown as sent; only the time label is the app's own text.
const NotificationRow = ({ item, onPress }: { item: AppNotification; onPress: () => void }) => {
  const { t } = useT();
  return (
    <Pressable style={({ pressed }) => [styles.row, !item.read && styles.rowUnread, pressed && { opacity: 0.6 }]} onPress={onPress}>
      {!item.read && <View style={styles.unreadDot} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.time}>{timeAgo(item.createdAt, t)}</Text>
      </View>
    </Pressable>
  );
};

export const NotificationCenterScreen = () => {
  const queryClient = useQueryClient();
  const { t } = useT();

  const notificationsQuery = useInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: ({ pageParam }) => notificationService.getMyNotifications(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  const notifications = useMemo(
    () => notificationsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [notificationsQuery.data]
  );
  const unreadCount = notificationsQuery.data?.pages[0]?.unreadCount ?? 0;

  const handlePress = (item: AppNotification) => {
    if (!item.read) {
      markReadMutation.mutate(item.id);
    }
    if (item.relatedType && item.relatedId !== null) {
      navigateToNotificationTarget({ relatedType: item.relatedType, relatedId: item.relatedId });
    }
  };

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <Pressable
          style={({ pressed }) => [styles.markAllButton, pressed && { opacity: 0.6 }]}
          disabled={markAllReadMutation.isPending}
          onPress={() => markAllReadMutation.mutate()}
        >
          <Text style={styles.markAllButtonText}>{t("notifications.markAllRead", { count: unreadCount })}</Text>
        </Pressable>
      )}

      {notificationsQuery.isLoading && <ListRowSkeletonList count={6} lines={3} variant="flat" />}

      {notificationsQuery.isError && (
        <ErrorState message={t("notifications.loadError")} onRetry={() => void notificationsQuery.refetch()} />
      )}

      {!notificationsQuery.isLoading && !notificationsQuery.isError && notifications.length === 0 && (
        <EmptyState icon={ICONS.notifications} message={t("notifications.empty")} />
      )}

      {notifications.length > 0 && (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <NotificationRow item={item} onPress={() => handlePress(item)} />}
          contentContainerStyle={styles.list}
          refreshing={notificationsQuery.isRefetching && !notificationsQuery.isFetchingNextPage}
          onRefresh={() => void notificationsQuery.refetch()}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (shouldFetchNextPage(notificationsQuery)) void notificationsQuery.fetchNextPage();
          }}
          ListFooterComponent={<LoadMoreFooter query={notificationsQuery} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  markAllButton: { padding: 14, alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.divider },
  markAllButtonText: { color: colors.primary, fontWeight: "600", fontSize: 13 },
  list: { paddingBottom: 24 },
  row: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowUnread: { backgroundColor: colors.grey100 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  title: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  message: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  time: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  footerLoader: { marginVertical: 16 },
});
