import { useCallback, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import { useNotificationSocket } from "@/hooks/use-notification-socket";
import { parseNotificationMetadata } from "@/lib/task-activity";
import { toast } from "@/hooks/use-toast";
import { useTaskDialog } from "@/context/task-dialog-provider";
import { NotificationType } from "@/types/api.type";
import { cn } from "@/lib/utils";

const unreadCountKey = ["notifications", "unread-count"] as const;
const notificationsListKey = (page: number) =>
  ["notifications", "list", page] as const;

const NOTIFICATIONS_PAGE_SIZE = 20;

const formatNotificationTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const secondsAgo = (Date.now() - date.getTime()) / 1000;
  if (secondsAgo < 60) return "just now";
  return formatDistanceToNow(date, { addSuffix: true });
};

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const { openTaskById } = useTaskDialog();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NotificationType[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [highlightBell, setHighlightBell] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: unreadCountKey,
    queryFn: getUnreadNotificationCount,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const unreadCount = unreadData?.count ?? 0;

  const { isLoading, isFetching } = useQuery({
    queryKey: notificationsListKey(page),
    queryFn: async () => {
      const result = await getNotifications(page, NOTIFICATIONS_PAGE_SIZE);
      setTotalPages(result.pagination.totalPages);
      setItems((prev) =>
        page === 1
          ? result.notifications
          : [...prev, ...result.notifications]
      );
      return result;
    },
    enabled: open,
    staleTime: 0,
  });

  const handleNewNotification = useCallback(
    (notification: NotificationType) => {
      queryClient.setQueryData<{ count: number }>(unreadCountKey, (old) => ({
        count: (old?.count ?? 0) + 1,
      }));

      setItems((prev) => {
        if (prev.some((n) => n._id === notification._id)) {
          return prev;
        }
        return [notification, ...prev];
      });

      setHighlightBell(true);
      window.setTimeout(() => setHighlightBell(false), 2500);

      toast({
        title: notification.title,
        description: notification.message,
        variant: "success",
      });
    },
    [queryClient]
  );

  useNotificationSocket(handleNewNotification);

  const { mutate: markRead } = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (result) => {
      queryClient.setQueryData<{ count: number }>(unreadCountKey, (old) => ({
        count: Math.max(0, (old?.count ?? 0) - 1),
      }));
      setItems((prev) =>
        prev.map((n) =>
          n._id === result.notification._id ? { ...n, isRead: true } : n
        )
      );
    },
  });

  const { mutate: markAllRead, isPending: isMarkingAll } = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueryData(unreadCountKey, { count: 0 });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    },
  });

  const handleNotificationClick = async (notification: NotificationType) => {
    if (!notification.isRead) {
      markRead(notification._id);
    }

    const { taskId, workspaceId } = parseNotificationMetadata(
      notification.metadata
    );

    if (taskId && workspaceId) {
      setOpen(false);
      await openTaskById(taskId, workspaceId);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setHighlightBell(false);
      setPage(1);
      setItems([]);
    }
  };

  const hasMore = page < totalPages;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 overflow-visible",
            unreadCount > 0 && "text-foreground"
          )}
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell
            className={cn(
              "h-5 w-5 transition-transform",
              highlightBell && "animate-bounce text-primary"
            )}
          />
          {unreadCount > 0 && (
            <span
              className="pointer-events-none absolute -top-1 -right-1 z-20 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-red-600 px-1 text-[10px] font-semibold leading-none text-white shadow-sm"
              aria-hidden
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold truncate">Notifications</h3>
            {unreadCount > 0 && (
              <span className="shrink-0 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs shrink-0"
            disabled={unreadCount === 0 || isMarkingAll}
            onClick={() => markAllRead()}
          >
            Mark all as read
          </Button>
        </div>
        <ScrollArea className="h-[min(360px,60vh)]">
          {isLoading && items.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10 px-4">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((notification) => (
                <li key={notification._id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full text-left px-3 py-3 hover:bg-muted/50 transition-colors",
                      !notification.isRead &&
                        "bg-primary/5 border-l-2 border-l-primary"
                    )}
                    onClick={() => void handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-2 pl-0.5">
                      {!notification.isRead && (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                      )}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            !notification.isRead && "font-semibold"
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {hasMore && (
            <div className="p-2 border-t flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                {isFetching ? (
                  <Loader className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
