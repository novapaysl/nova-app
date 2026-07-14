import { useState } from "react";
import { useGetIdentity, useList, useUpdate } from "@refinedev/core";
import { Bell, Info, AlertTriangle, CheckCircle2, BellOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Identity = { id: string; name?: string; email?: string };

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  status: string;
  created_at: string;
};

type FilterTab = "all" | "unread" | "read";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m} ${m === 1 ? "minute" : "minutes"} ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  }
  if (diff < 604800) {
    const d = Math.floor(diff / 86400);
    return `${d} ${d === 1 ? "day" : "days"} ago`;
  }
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function NotificationIcon({ type }: { type?: string }) {
  const t = (type ?? "").toLowerCase();
  if (t === "warning")
    return (
      <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
      </div>
    );
  if (t === "success")
    return (
      <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      </div>
    );
  // default = info
  return (
    <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
      <Info className="h-5 w-5 text-[#1DA1F2]" />
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 border-b border-gray-100 last:border-b-0">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full max-w-sm" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// ─── Single Notification Card ─────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
  isUpdating,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  isUpdating: boolean;
}) {
  const isUnread = (notification.status ?? "").toLowerCase() === "unread";

  const handleClick = () => {
    if (isUnread) onMarkRead(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-4 p-4 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors hover:bg-gray-50 relative ${
        isUnread ? "bg-blue-50/40" : "bg-white"
      }`}>
      {/* Unread indicator dot */}
      {isUnread && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-1 rounded-r-full"
          style={{ backgroundColor: "#1DA1F2" }}
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <NotificationIcon type={notification.notification_type} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p
            className={`text-sm leading-snug ${isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}
            style={{ fontFamily: "Poppins, sans-serif" }}>
            {notification.title || "Notification"}
          </p>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
            {relativeTime(notification.created_at)}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notification.message || ""}</p>

        {isUnread && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            disabled={isUpdating}
            className="mt-2 text-xs font-semibold text-[#1DA1F2] hover:text-blue-700 transition-colors disabled:opacity-50">
            {isUpdating ? "Marking..." : "Mark as Read"}
          </button>
        )}
      </div>

      {/* Unread blue dot badge */}
      {isUnread && (
        <span
          className="h-2.5 w-2.5 rounded-full flex-shrink-0 mt-1.5"
          style={{ backgroundColor: "#1DA1F2" }}
          aria-label="Unread"
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const NotificationsPage = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const userId = identity?.id;

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const { mutate: updateNotification } = useUpdate();

  // Fetch all notifications for this user, sorted newest first
  const { result, query } = useList<Notification>({
    resource: "notifications",
    filters: userId ? [{ field: "user_id", operator: "eq", value: userId }] : [],
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { pageSize: 100 },
    queryOptions: { enabled: !!userId },
  });

  const allNotifications = (result.data ?? []) as Notification[];
  const isLoading = query.isLoading;

  // Filter by tab
  const displayed =
    activeTab === "all"
      ? allNotifications
      : allNotifications.filter((n) =>
          activeTab === "unread"
            ? (n.status ?? "").toLowerCase() === "unread"
            : (n.status ?? "").toLowerCase() === "read",
        );

  const unreadCount = allNotifications.filter((n) => (n.status ?? "").toLowerCase() === "unread").length;

  // Mark single as read
  const handleMarkRead = (id: string) => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    updateNotification(
      { resource: "notifications", id, values: { status: "read" } },
      {
        onSettled: () => {
          setUpdatingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
      },
    );
  };

  // Mark all unread as read
  const handleMarkAllRead = async () => {
    const unread = allNotifications.filter((n) => (n.status ?? "").toLowerCase() === "unread");
    if (unread.length === 0) return;
    setMarkingAll(true);
    let settled = 0;
    unread.forEach((n) => {
      updateNotification(
        { resource: "notifications", id: n.id, values: { status: "read" } },
        {
          onSettled: () => {
            settled++;
            if (settled === unread.length) setMarkingAll(false);
          },
        },
      );
    });
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "read", label: "Read" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Heading */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1DA1F2, #22C55E)" }}>
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
              Notifications
            </h1>
            {!isLoading && unreadCount > 0 && (
              <p className="text-sm text-gray-500">
                {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
              </p>
            )}
          </div>
        </div>

        {/* Mark All as Read */}
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-sm font-medium border-gray-300 text-gray-600 hover:border-[#1DA1F2] hover:text-[#1DA1F2] transition-colors h-9">
            {markingAll ? "Marking..." : "Mark All as Read"}
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex border-b border-gray-100">
          {tabs.map(({ key, label }) => {
            const isActive = activeTab === key;
            const count =
              key === "all"
                ? allNotifications.length
                : key === "unread"
                  ? allNotifications.filter((n) => (n.status ?? "").toLowerCase() === "unread").length
                  : allNotifications.filter((n) => (n.status ?? "").toLowerCase() === "read").length;

            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 sm:flex-none px-5 py-3 text-sm font-semibold transition-colors relative ${
                  isActive ? "text-[#1DA1F2]" : "text-gray-500 hover:text-gray-700"
                }`}>
                {label}
                {count > 0 && (
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-blue-100 text-[#1DA1F2]" : "bg-gray-100 text-gray-500"
                    }`}>
                    {count}
                  </span>
                )}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                    style={{ backgroundColor: "#1DA1F2" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        <div>
          {/* Loading skeletons */}
          {isLoading && (
            <>
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </>
          )}

          {/* Empty state */}
          {!isLoading && displayed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                <BellOff className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-600 font-semibold text-sm">No notifications yet</p>
              <p className="text-gray-400 text-xs text-center max-w-[240px]">
                {activeTab === "unread"
                  ? "You're all caught up! No unread notifications."
                  : activeTab === "read"
                    ? "No read notifications to display."
                    : "We'll notify you when something arrives."}
              </p>
            </div>
          )}

          {/* Notification items */}
          {!isLoading &&
            displayed.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={handleMarkRead}
                isUpdating={updatingIds.has(n.id)}
              />
            ))}
        </div>
      </div>
    </div>
  );
};
