"use client";

/**
 * FormField — micro-interacciones estilo Emil Kowalski
 *
 * Principios aplicados:
 * - Focus ring con scale ligero del label
 * - Transición de border color con spring physics
 * - Error state con shake animation
 * - Label flotante con interpolación física
 */

import { motion, AnimatePresence } from "framer-motion";
import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  success?: boolean;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      hint,
      success,
      prefix,
      suffix,
      loading,
      className,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const [focused, setFocused] = useState(false);

    const hasValue = Boolean(props.value || props.defaultValue);
    const floatLabel = focused || hasValue;

    const borderColor = error
      ? "var(--error)"
      : focused
      ? "var(--accent-bright)"
      : success
      ? "var(--success)"
      : "var(--border)";

    return (
      <div className={cn("relative", className)}>
        {/* Container */}
        <motion.div
          animate={{
            borderColor,
            boxShadow: focused
              ? `0 0 0 3px ${error ? "rgba(239,68,68,0.12)" : "rgba(139,92,246,0.14)"}`
              : "0 0 0 0px transparent",
          }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[10px] border overflow-hidden"
          style={{
            backgroundColor: focused ? "var(--surface-raised)" : "var(--surface)",
          }}
        >
          {/* Floating label */}
          <motion.label
            htmlFor={id}
            animate={{
              y: floatLabel ? 0 : 12,
              scale: floatLabel ? 0.82 : 1,
              color: focused
                ? "var(--accent-bright)"
                : error
                ? "var(--error)"
                : "var(--foreground-subtle)",
            }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-3 top-2 origin-left text-sm font-medium pointer-events-none z-10"
            style={{ transformOrigin: "left top" }}
          >
            {label}
          </motion.label>

          <div className="flex items-center">
            {prefix && (
              <span
                className="pl-3 text-sm shrink-0"
                style={{ color: "var(--foreground-muted)" }}
              >
                {prefix}
              </span>
            )}

            <input
              ref={ref}
              id={id}
              onFocus={(e) => {
                setFocused(true);
                onFocus?.(e);
              }}
              onBlur={(e) => {
                setFocused(false);
                onBlur?.(e);
              }}
              className={cn(
                "w-full bg-transparent px-3 pb-2.5 pt-6",
                "text-sm font-medium",
                "outline-none placeholder:opacity-0",
                "transition-colors"
              )}
              style={{ color: "var(--foreground)" }}
              {...props}
            />

            {/* Status icon */}
            <AnimatePresence mode="wait">
              {(error || success || loading) && (
                <motion.span
                  key={error ? "error" : success ? "success" : "loading"}
                  initial={{ opacity: 0, scale: 0.6, x: 4 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.6, x: 4 }}
                  transition={{ duration: 0.15, ease: [0.175, 0.885, 0.32, 1.275] }}
                  className="pr-3 shrink-0"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      className="w-4 h-4 rounded-full border-2 border-t-transparent"
                      style={{ borderColor: "var(--accent-bright)" }}
                    />
                  ) : error ? (
                    <AlertCircle size={15} style={{ color: "var(--error)" }} />
                  ) : (
                    <CheckCircle2 size={15} style={{ color: "var(--success)" }} />
                  )}
                </motion.span>
              )}
            </AnimatePresence>

            {suffix && !error && !success && !loading && (
              <span
                className="pr-3 text-sm shrink-0"
                style={{ color: "var(--foreground-muted)" }}
              >
                {suffix}
              </span>
            )}
          </div>
        </motion.div>

        {/* Error / Hint message */}
        <AnimatePresence>
          {(error || hint) && (
            <motion.p
              key={error ?? hint}
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mt-1.5 px-1 text-xs leading-relaxed"
              style={{ color: error ? "var(--error)" : "var(--foreground-muted)" }}
            >
              {error ?? hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FormField.displayName = "FormField";

// ─── SELECT FIELD ─────────────────────────────────────────────────────────────

interface SelectFieldProps {
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  hint?: string;
  className?: string;
}

export function SelectField({
  label,
  options,
  value,
  onChange,
  error,
  hint,
  className,
}: SelectFieldProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(value);

  return (
    <div className={cn("relative", className)}>
      <motion.div
        animate={{
          borderColor: error
            ? "var(--error)"
            : focused
            ? "var(--accent-bright)"
            : "var(--border)",
          boxShadow: focused
            ? "0 0 0 3px rgba(139,92,246,0.14)"
            : "0 0 0 0px transparent",
        }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-[10px] border overflow-hidden"
        style={{ backgroundColor: focused ? "var(--surface-raised)" : "var(--surface)" }}
      >
        <motion.label
          htmlFor={id}
          animate={{
            y: hasValue || focused ? 0 : 12,
            scale: hasValue || focused ? 0.82 : 1,
            color: focused ? "var(--accent-bright)" : "var(--foreground-subtle)",
          }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-3 top-2 origin-left text-sm font-medium pointer-events-none z-10"
          style={{ transformOrigin: "left top" }}
        >
          {label}
        </motion.label>

        <select
          id={id}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent px-3 pb-2.5 pt-6 text-sm font-medium outline-none appearance-none cursor-pointer"
          style={{ color: "var(--foreground)" }}
        >
          <option value="" disabled />
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={{ backgroundColor: "var(--surface)", color: "var(--foreground)" }}
            >
              {opt.label}
            </option>
          ))}
        </select>
      </motion.div>

      <AnimatePresence>
        {(error || hint) && (
          <motion.p
            key={error ?? hint}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-1.5 px-1 text-xs"
            style={{ color: error ? "var(--error)" : "var(--foreground-muted)" }}
          >
            {error ?? hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
