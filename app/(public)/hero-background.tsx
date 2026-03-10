"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const HeroScene = dynamic(() => import("@/components/viewer/hero-scene"), {
  ssr: false,
  loading: () => null,
});

export function HeroBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Suspense fallback={null}>
        <HeroScene />
      </Suspense>
    </div>
  );
}
