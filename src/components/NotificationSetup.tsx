"use client";

import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) bytes[i] = rawData.charCodeAt(i);
  return bytes.buffer;
}

type Status = "unsupported" | "loading" | "denied" | "enabled" | "disabled";

export default function NotificationSetup() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    const existing = await registration.pushManager.getSubscription();
    setStatus(existing ? "enabled" : "disabled");
  }, []);

  useEffect(() => {
    // Registering the service worker and reading its push subscription is
    // inherently async browser-API synchronization, not derived render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshStatus();
  }, [refreshStatus]);

  async function enable() {
    setError(null);
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setError("Push notifications aren't configured on this deployment yet.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "disabled");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      setStatus("enabled");
    } catch (err) {
      console.error(err);
      setError("Couldn't enable notifications. Try again.");
    }
  }

  async function disable() {
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("disabled");
    } catch (err) {
      console.error(err);
      setError("Couldn't disable notifications. Try again.");
    }
  }

  if (status === "loading") return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Push notifications</h3>
      {status === "unsupported" && (
        <p className="mt-1 text-sm text-slate-500">
          Your browser doesn&apos;t support push notifications. Try Chrome, Edge, or Safari 16.4+.
        </p>
      )}
      {status === "denied" && (
        <p className="mt-1 text-sm text-slate-500">
          Notifications are blocked for this site. Enable them in your browser&apos;s site settings.
        </p>
      )}
      {status === "disabled" && (
        <>
          <p className="mt-1 text-sm text-slate-500">
            Get a reminder here when a prospect hasn&apos;t been contacted in 2+ weeks.
          </p>
          <button
            onClick={enable}
            className="mt-3 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Enable follow-up reminders
          </button>
        </>
      )}
      {status === "enabled" && (
        <>
          <p className="mt-1 text-sm text-emerald-600">Follow-up reminders are on for this browser.</p>
          <button
            onClick={disable}
            className="mt-3 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Turn off
          </button>
        </>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
