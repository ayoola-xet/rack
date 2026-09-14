import { createFileRoute } from "@tanstack/react-router";
import { ProgramsScreen } from "@/components/workout/programs-screen";

export const Route = createFileRoute("/programs/")({ component: ProgramsPage });

function ProgramsPage() {
  return <ProgramsScreen />;
}
