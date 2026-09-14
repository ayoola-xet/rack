import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/workout/home-screen";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <HomeScreen />;
}
