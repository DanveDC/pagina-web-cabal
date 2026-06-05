"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, WifiOff, RefreshCw, ServerCrash } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── VARIANTES DE ERROR ───────────────────────────────────────────────────────

type ErrorVariant = "api" | "local_server" | "network" | "generic";

interface ErrorStateProps {
  variant?: ErrorVariant;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

const variantConfig: Record<
  ErrorVariant,
  { icon: React.ElementType; color: string; defaultTitle: string; defaultDesc: string }
> = {
  api: {
    icon: AlertTriangle,
    color: "var(--warning)",
    defaultTitle: "Error al calcular cotización",
    defaultDesc: "La aseguradora no respondió. Reintentando automáticamente…",
  },
  local_server: {
    icon: ServerCrash,
    color: "var(--error)",
    defaultTitle: "Servidor local no disponible",
    defaultDesc: "No se pudo conectar con el servidor de la oficina. Verifica la conexión de red.",
  },
  network: {
    icon: WifiOff,
    color: "var(--error)",
    defaultTitle: "Sin conexión a internet",
    defaultDesc: "Revisa tu conexión e intenta de nuevo.",
  },
  generic: {
    icon: AlertTriangle,
    color: "var(--foreground-muted)",
    defaultTitle: "Algo salió mal",
    defaultDesc: "Ocurrió un error inesperado.",
  },
};

export function ErrorState({
  variant = "generic",
  title,
  description,
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "rounded-xl border p-6 flex flex-col items-center text-center gap-4",
          className
        )}
        style={{
          borderColor: `${config.color}22`,
          backgroundColor: `${config.color}08`,
        }}
        role="alert"
        aria-live="assertive"
      >
        {/* Icon con glow sutil */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
          className="flex items-center justify-center w-12 h-12 rounded-xl"
          style={{
            backgroundColor: `${config.color}12`,
            border: `1px solid ${config.color}22`,
          }}
        >
          <Icon size={22} style={{ color: config.color }} />
        </motion.div>

        <div className="space-y-1">
          <p
            className="font-semibold text-sm tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {title ?? config.defaultTitle}
          </p>
          <p
            className="text-sm leading-relaxed max-w-xs"
            style={{ color: "var(--foreground-muted)" }}
          >
            {description ?? config.defaultDesc}
          </p>
        </div>

        {onRetry && (
          <motion.button
            onClick={onRetry}
            disabled={retrying}
            whileHover={{ scale: retrying ? 1 : 1.02 }}
            whileTap={{ scale: retrying ? 1 : 0.97 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
              "border transition-colors",
              retrying && "opacity-60 cursor-not-allowed"
            )}
            style={{
              backgroundColor: "var(--surface-raised)",
              borderColor: "var(--border-hover)",
              color: "var(--foreground)",
            }}
          >
            <motion.span
              animate={retrying ? { rotate: 360 } : { rotate: 0 }}
              transition={
                retrying
                  ? { repeat: Infinity, duration: 0.8, ease: "linear" }
                  : { duration: 0.2 }
              }
            >
              <RefreshCw size={14} />
            </motion.span>
            {retrying ? "Reintentando…" : "Intentar de nuevo"}
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── BANNER DE LATENCIA ALTA (inline, no bloquea UI) ─────────────────────────

interface LatencyBannerProps {
  latenciaMs: number;
  onDismiss?: () => void;
}

export function LatencyBanner({ latenciaMs, onDismiss }: LatencyBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs border"
        style={{
          backgroundColor: "var(--warning-surface)",
          borderColor: "rgba(245, 158, 11, 0.2)",
          color: "var(--warning)",
        }}
      >
        <AlertTriangle size={13} />
        <span className="font-medium">
          Servidor local con latencia alta ({latenciaMs}ms). Los resultados pueden demorar.
        </span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  );
}
