"use client";

import { Bell } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type LatestClient = {
  _id: string;
  name: string;
  contactName?: string;
  buyerName?: string;
  createdAt: number;
};

type AlertItem = {
  id: string;
  title: string;
  subtitle: string;
  createdAt: number;
};

export default function PmrLiveHeader({
  initialLatestClients,
}: {
  initialLatestClients: LatestClient[];
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AlertItem[]>([]);
  const knownClientIds = useRef<Set<string>>(new Set(initialLatestClients.map((c) => c._id)));

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const response = await fetch("/api/pmr/updates", { cache: "no-store" });
        if (!response.ok) return;
        const json = await response.json();
        const latestClients: LatestClient[] = (json?.data?.latestClients ?? []).map((client: any) => ({
          _id: String(client._id),
          name: client.name,
          contactName: client.contactName,
          buyerName: client.buyerName,
          createdAt: client.createdAt ?? Date.now(),
        }));

        if (!active || !latestClients.length) return;

        const newClients = latestClients.filter((client) => !knownClientIds.current.has(client._id));
        if (newClients.length) {
          for (const client of latestClients) {
            knownClientIds.current.add(client._id);
          }

          const newAlerts = newClients.map((client) => ({
            id: `${client._id}-${client.createdAt}`,
            title: `New client added: ${client.name}`,
            subtitle: `Buyer: ${client.buyerName ?? "Buyer"}`,
            createdAt: client.createdAt,
          }));

          setNotifications((prev) => [...newAlerts, ...prev].slice(0, 40));
          setUnreadCount((prev) => prev + newAlerts.length);
        }
      } catch {
        // Silent failure for polling in passive investor view.
      }
    };

    const intervalId = window.setInterval(poll, 20000);
    void poll();
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const topNotificationTime = useMemo(
    () => (notifications[0] ? new Date(notifications[0].createdAt).toLocaleString("en-US") : null),
    [notifications]
  );

  const toggleBell = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) setUnreadCount(0);
  };

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggleBell}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white hover:bg-muted"
        aria-label="Open alerts"
        title="Open alerts"
      >
        <Bell className="h-4 w-4 text-[#234c4b]" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-20 w-[min(92vw,380px)] rounded-xl border bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#234c4b]">Client alerts</p>
            <p className="text-[11px] text-muted-foreground">{topNotificationTime ?? "No recent alerts"}</p>
          </div>

          <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted-foreground">No new clients detected yet.</p>
            ) : (
              notifications.map((alert) => (
                <article key={alert.id} className="rounded-md border p-2">
                  <p className="text-xs font-semibold">{alert.title}</p>
                  <p className="text-[11px] text-muted-foreground">{alert.subtitle}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(alert.createdAt).toLocaleString("en-US")}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
