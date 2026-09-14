import { createFileRoute } from "@tanstack/react-router";
import { GoalsScreen } from "@/components/workout/goals-screen";

export const Route = createFileRoute("/goals")({ component: GoalsPage });

function GoalsPage() {
  return <GoalsScreen />;
}
