"use client";

import clsx from "clsx";
import type { RiskLevel } from "@/types";

interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
}

const riskConfig: Record<
  RiskLevel,
  { label: string; classes: string }
> = {
  low: {
    label: "Low Risk",
    classes:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  medium: {
    label: "Medium Risk",
    classes:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  high: {
    label: "High Risk",
    classes:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  critical: {
    label: "Critical Risk",
    classes:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export default function RiskBadge({ level, size = "md" }: RiskBadgeProps) {
  const config = riskConfig[level];
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.classes,
        sizeClasses[size]
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          level === "low" && "bg-emerald-500",
          level === "medium" && "bg-amber-500",
          level === "high" && "bg-orange-500",
          level === "critical" && "bg-red-500"
        )}
      />
      {config.label}
    </span>
  );
}
