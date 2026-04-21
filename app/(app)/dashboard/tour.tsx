"use client";

import { useEffect, useState } from "react";
import { Tour } from "@/components/ui/tour";

const BASE_STEPS = [
  {
    target: ".subscription-card",
    title: "Your Plan",
    content: "This shows your current subscription. Upgrade to Pro or Enterprise to unlock the Playbook platform and 3D viewer.",
    position: "bottom" as const,
  },
  {
    target: "nav [href='/viewer']",
    title: "3D Football Viewer",
    content: "Watch your plays animated on a real 3D football field. Player routes animate in real time — orbit and zoom with your mouse.",
    position: "bottom" as const,
  },
  {
    target: "nav [href='/assets']",
    title: "Assets",
    content: "Upload and manage files like playbooks, game film, or scouting reports for your team.",
    position: "bottom" as const,
  },
];

const COACH_STEPS = [
  {
    target: "nav [href='/playbook']",
    title: "Playbook — Coach Center",
    content: "Start here. Create a team, build playbooks, design plays on the canvas, and invite your players.",
    position: "bottom" as const,
  },
  {
    target: ".quick-actions",
    title: "Quick Actions",
    content: "Create a team first — it takes 30 seconds. Then build a playbook, draw your first play, and invite a player to drill it.",
    position: "top" as const,
  },
];

const PLAYER_STEPS = [
  {
    target: "nav [href='/learn']",
    title: "Learn — Your Drill Hub",
    content: "This is where you master your playbook. Every play goes through 4 phases: Study → Identify → Execute → Game Ready.",
    position: "bottom" as const,
  },
  {
    target: ".quick-actions",
    title: "Start Drilling",
    content: "Earn XP, build streaks, and climb the team leaderboard. The smarter you drill, the less often plays come back for review.",
    position: "top" as const,
  },
];

interface DashboardTourProps {
  isCoach?: boolean;
  isPlayer?: boolean;
}

export function DashboardTour({ isCoach = false, isPlayer = false }: DashboardTourProps) {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("tour_completed");
    if (!completed) {
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showTour) return null;

  const roleSteps = isCoach ? COACH_STEPS : isPlayer ? PLAYER_STEPS : [];
  const steps = [...BASE_STEPS, ...roleSteps];

  return (
    <Tour
      steps={steps}
      onComplete={() => setShowTour(false)}
    />
  );
}
