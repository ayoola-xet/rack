import { createFileRoute } from "@tanstack/react-router";
import { SettingsScreen } from "@/components/workout/settings-screen";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  return <SettingsScreen />;
}
