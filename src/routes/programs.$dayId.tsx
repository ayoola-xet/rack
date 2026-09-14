import { createFileRoute } from "@tanstack/react-router";
import { ProgramEditor } from "@/components/workout/program-editor";

export const Route = createFileRoute("/programs/$dayId")({ component: ProgramEditPage });

function ProgramEditPage() {
  const { dayId } = Route.useParams();
  return <ProgramEditor dayId={dayId} />;
}
