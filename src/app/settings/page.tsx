import AppHeader from "@/components/AppHeader";
import NotificationSetup from "@/components/NotificationSetup";
import ChangePasscodeForm from "@/components/ChangePasscodeForm";

export default function SettingsPage() {
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
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Change login passcode</h3>
          <p className="mt-1 text-sm text-slate-500">
            Updates the passcode everyone uses to log in. Existing sessions on other
            devices stay logged in until they expire.
          </p>
          <div className="mt-3">
            <ChangePasscodeForm />
          </div>
        </div>
      </main>
    </div>
  );
}
