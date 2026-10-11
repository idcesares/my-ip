"use client";

import { memo } from "react";
import { m } from "framer-motion";
import { BrowserPanel } from "@/components/diagnostics/browser-panel";
import { formatMeasuredAt } from "@/components/diagnostics/format";
import { NetworkPanel } from "@/components/diagnostics/network-panel";
import { PrivacyPanel } from "@/components/diagnostics/privacy-panel";
import { SecurityPanel } from "@/components/diagnostics/security-panel";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { BrowserDiagnosticsSnapshot } from "@/types";

export const InfoGrid = memo(function InfoGrid({
  data,
  showAdvanced,
  onToggleAdvanced,
  onRemeasure,
  measuring = false,
}: {
  data: BrowserDiagnosticsSnapshot | null;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onRemeasure?: () => void;
  measuring?: boolean;
}) {
  if (!data) {
    return (
      <div className="grid gap-px border border-[hsl(var(--border))] bg-[hsl(var(--border))] lg:grid-cols-2 xl:grid-cols-4">
        <div className="h-44 bg-[hsl(var(--card))]" />
        <div className="h-44 bg-[hsl(var(--card))]" />
        <div className="h-44 bg-[hsl(var(--card))]" />
        <div className="h-44 bg-[hsl(var(--card))]" />
      </div>
    );
  }

  const measuredAt = formatMeasuredAt(data.security.probedAt);

  return (
    <TooltipProvider>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
          Diagnostic panels
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          {onRemeasure ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 w-full sm:w-auto"
              disabled={measuring}
              onClick={onRemeasure}
            >
              {measuring ? "Measuring…" : "Re-measure"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={showAdvanced ? "secondary" : "outline"}
            size="sm"
            className="min-h-11 w-full sm:w-auto"
            onClick={onToggleAdvanced}
            aria-pressed={showAdvanced}
          >
            {showAdvanced ? "Show basic signals" : "Show advanced signals"}
          </Button>
        </div>
      </div>
      <p className="mb-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
        Browser API values are capability signals, not hardware guarantees.
        Network API values marked as estimates are rounded browser observations;
        page fetch duration is an active same-origin measurement.
      </p>
      <p className="mb-4 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
        {measuredAt
          ? `Page fetch and header checks last ran at ${measuredAt}.`
          : "Page fetch and header checks have not completed yet."}
      </p>
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="grid gap-px border border-[hsl(var(--border))] bg-[hsl(var(--border))] lg:grid-cols-2 xl:grid-cols-4"
      >
        <NetworkPanel data={data} showAdvanced={showAdvanced} />
        <BrowserPanel data={data} showAdvanced={showAdvanced} />
        <PrivacyPanel data={data} showAdvanced={showAdvanced} />
        <SecurityPanel data={data} showAdvanced={showAdvanced} />
      </m.div>
    </TooltipProvider>
  );
});
