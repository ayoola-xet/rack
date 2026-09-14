import { createFileRoute } from "@tanstack/react-router";
import { ProgressScreen } from "@/components/workout/progress-screen";

export const Route = createFileRoute("/progress")({ component: ProgressPage });

function ProgressPage() {
  return <ProgressScreen />;
}
