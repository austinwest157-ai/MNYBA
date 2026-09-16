import AppHeader from "@/components/AppHeader";
import NotificationSetup from "@/components/NotificationSetup";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage reminders for this browser/device.
        </p>
        <div className="mt-6">
          <NotificationSetup />
        </div>
      </main>
    </div>
  );
}
