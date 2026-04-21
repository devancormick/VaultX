"use client";

import { useEffect, useState } from "react";
import { Tour } from "@/components/ui/tour";

const tourSteps = [
  {
    target: "nav [href='/dashboard']",
    title: "Welcome to VaultX!",
    content: "This is your dashboard - your central hub for managing assets, viewing activity, and accessing all features.",
    position: "bottom" as const,
  },
  {
    target: "nav [href='/viewer']",
    title: "Viewer",
    content: "Use the Viewer to securely share and access your assets. It's perfect for presentations and collaborations.",
    position: "bottom" as const,
  },
  {
    target: "nav [href='/assets']",
    title: "Assets",
    content: "Manage all your uploaded files and documents here. Organize, search, and control access to your content.",
    position: "bottom" as const,
  },
  {
    target: "nav [href='/playbook']",
    title: "Playbook",
    content: "Create and manage your sports teams, strategies, and plays. This is where coaches build their game plans.",
    position: "bottom" as const,
  },
  {
    target: "nav [href='/learn']",
    title: "Learn",
    content: "Access training materials and resources. Players can review plays and improve their skills.",
    position: "bottom" as const,
  },
  {
    target: ".subscription-card",
    title: "Your Subscription",
    content: "Track your plan status and manage billing here. Upgrade for more features and storage.",
    position: "top" as const,
  },
  {
    target: ".quick-actions",
    title: "Quick Actions",
    content: "These buttons give you fast access to the most common tasks. Start by opening the Viewer or browsing your assets.",
    position: "top" as const,
  },
];

export function DashboardTour() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("tour_completed");
    if (!completed) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showTour) return null;

  return (
    <Tour
      steps={tourSteps}
      onComplete={() => setShowTour(false)}
    />
  );
}