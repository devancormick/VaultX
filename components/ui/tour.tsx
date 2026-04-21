"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface TourProps {
  steps: TourStep[];
  onComplete?: () => void;
}

export function Tour({ steps, onComplete }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  useEffect(() => {
    if (!step) return;

    const target = document.querySelector(step.target);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const overlay = overlayRef.current;
    const tooltip = tooltipRef.current;

    if (overlay && tooltip) {
      // Position overlay highlight
      overlay.style.top = `${rect.top - 4}px`;
      overlay.style.left = `${rect.left - 4}px`;
      overlay.style.width = `${rect.width + 8}px`;
      overlay.style.height = `${rect.height + 8}px`;

      // Position tooltip
      const position = step.position || "bottom";
      let tooltipTop = rect.top;
      let tooltipLeft = rect.left + rect.width / 2;

      switch (position) {
        case "top":
          tooltipTop = rect.top - 10;
          break;
        case "bottom":
          tooltipTop = rect.bottom + 10;
          break;
        case "left":
          tooltipLeft = rect.left - 10;
          tooltipTop = rect.top + rect.height / 2;
          break;
        case "right":
          tooltipLeft = rect.right + 10;
          tooltipTop = rect.top + rect.height / 2;
          break;
      }

      tooltip.style.top = `${tooltipTop}px`;
      tooltip.style.left = `${tooltipLeft}px`;
      tooltip.style.transform = position === "left" || position === "right" ? "translateY(-50%)" : "translateX(-50%)";
    }
  }, [step]);

  const next = () => {
    if (isLast) {
      complete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const complete = () => {
    setIsVisible(false);
    localStorage.setItem("tour_completed", "true");
    onComplete?.();
  };

  const skip = () => {
    setIsVisible(false);
    localStorage.setItem("tour_completed", "true");
    onComplete?.();
  };

  if (!isVisible || !step) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 pointer-events-none" />

      {/* Highlight overlay */}
      <div
        ref={overlayRef}
        className="fixed z-50 border-2 border-accent rounded-lg pointer-events-none"
        style={{ boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)" }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-surface border border-border rounded-lg shadow-lg p-4 max-w-xs w-full"
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-text">{step.title}</h3>
          <button
            onClick={skip}
            className="text-muted hover:text-text p-1"
            aria-label="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted mb-4">{step.content}</p>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted">
            {currentStep + 1} of {steps.length}
          </div>
          <div className="flex gap-2">
            {!isFirst && (
              <Button variant="ghost" size="sm" onClick={prev}>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {isLast ? "Finish" : "Next"}
              {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}