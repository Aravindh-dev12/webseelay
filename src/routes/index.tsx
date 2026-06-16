import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const CityExperience = lazy(() =>
  import("@/components/city/CityExperience").then((m) => ({
    default: m.CityExperience,
  })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OPZBLUE // Neo-Metropolis — AI Engineer Portfolio" },
      {
        name: "description",
        content:
          "An interactive cyberpunk metropolis portfolio by OpzBlue — AI engineer. Explore projects as buildings in a living 3D city with holographic facades.",
      },
      { property: "og:title", content: "OPZBLUE // Neo-Metropolis" },
      {
        property: "og:description",
        content:
          "Explore a real-time WebGL cyberpunk city where each skyscraper is a project.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  // R3F + WebGL must only run in the browser. Guard against SSR.
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  if (!isClient) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#02030a",
          color: "#9ef3ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "ui-monospace, monospace",
          letterSpacing: 4,
          fontSize: 12,
        }}
      >
        INITIALIZING NEO_METROPOLIS…
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#02030a",
            color: "#9ef3ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "ui-monospace, monospace",
            letterSpacing: 4,
            fontSize: 12,
          }}
        >
          STREAMING SHADERS…
        </div>
      }
    >
      <CityExperience />
    </Suspense>
  );
}
