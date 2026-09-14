import { createFileRoute } from "@tanstack/react-router";
import { SessionScreen } from "@/components/workout/session-screen";

export const Route = createFileRoute("/session")({ component: SessionPage });

function SessionPage() {
  return <SessionScreen />;
}
