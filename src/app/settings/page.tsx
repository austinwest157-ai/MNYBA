import AppHeader from "@/components/AppHeader";
import NotificationSetup from "@/components/NotificationSetup";
import PasscodeSettings from "@/components/PasscodeSettings";
import { isLoginRequired } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const loginEnabled = await isLoginRequired();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage reminders and login for this app.
        </p>
        <div className="mt-6">
          <NotificationSetup />
        </div>
        <div className="mt-6">
          <PasscodeSettings initialEnabled={loginEnabled} />
        </div>
      </main>
    </div>
  );
}
