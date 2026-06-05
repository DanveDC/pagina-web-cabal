"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  height?: number | string;
  width?: number | string;
  rounded?: "sm" | "md" | "lg" | "full";
}

export function Skeleton({ className, height, width, rounded = "md" }: SkeletonProps) {
  const radiusMap = {
    sm:   "rounded-[4px]",
    md:   "rounded-[8px]",
    lg:   "rounded-[12px]",
    full: "rounded-full",
  };

  return (
    <div
      className={cn("skeleton", radiusMap[rounded], className)}
      style={{ height, width }}
      aria-hidden="true"
    />
  );
}

// ─── Skeleton para card de oferta de aseguradora ─────────────────────────────

export function SkeletonOfertaCard() {
  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
      }}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton height={40} width={40} rounded="lg" />
          <div className="space-y-2">
            <Skeleton height={14} width={120} />
            <Skeleton height={12} width={80} />
          </div>
        </div>
        <Skeleton height={32} width={100} rounded="full" />
      </div>

      <div className="h-px" style={{ backgroundColor: "var(--border)" }} />

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton height={11} width={70} />
            <Skeleton height={16} width={90} />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton height={8} width={8} rounded="full" />
            <Skeleton height={12} width={`${60 + i * 15}%`} />
          </div>
        ))}
      </div>

      <Skeleton height={42} rounded="lg" />
    </div>
  );
}

// ─── Skeleton para resultados de cotización (grid) ────────────────────────────

export function SkeletonResultados({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton height={22} width={240} />
          <Skeleton height={14} width={180} />
        </div>
        <Skeleton height={36} width={120} rounded="lg" />
      </div>
      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonOfertaCard key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton para formulario multi-paso ─────────────────────────────────────

export function SkeletonFormulario() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={4} className="flex-1" rounded="full" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton height={12} width={`${30 + i * 8}%`} />
            <Skeleton height={44} rounded="lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
