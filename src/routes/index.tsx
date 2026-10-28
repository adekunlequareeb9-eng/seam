import { createFileRoute } from "@tanstack/react-router";
import { SeamApp } from "@/components/seam/seam-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <SeamApp />;
}
