"use client";

import {
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  ScanSearch,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  DiagnosticAssessment,
  DiagnosticFindingStatus,
} from "@/lib/privacy-score";

function FindingIcon({ status }: { status: DiagnosticFindingStatus }) {
  if (status === "positive")
    return (
      <CheckCircle2
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-emerald-500"
      />
    );
  if (status === "attention")
    return (
      <AlertCircle
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-amber-500"
      />
    );
  if (status === "unavailable")
    return (
      <CircleHelp
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]"
      />
    );
  return (
    <ScanSearch aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-500" />
  );
}

export function DiagnosticFindingsCard({
  assessment,
}: {
  assessment: DiagnosticAssessment;
}) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
          <span className="flex items-center gap-2">
            <ScanSearch aria-hidden="true" className="h-4 w-4 text-sky-500" />
            Diagnostic findings
          </span>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {assessment.summary.attention > 0 && (
              <Badge
                variant="outline"
                className="text-amber-600 dark:text-amber-400"
              >
                {assessment.summary.attention} need attention
              </Badge>
            )}
            {assessment.summary.unavailable > 0 && (
              <Badge
                variant="outline"
                className="text-[hsl(var(--muted-foreground))]"
              >
                {assessment.summary.unavailable} checking/unavailable
              </Badge>
            )}
          </div>
        </CardTitle>
        <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          Observations with their source shown explicitly. These findings are
          not a universal privacy score.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-2">
          {assessment.findings.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex min-w-0 items-start gap-2.5 rounded-lg border bg-[hsl(var(--background))/0.45] px-3 py-3 text-sm",
                item.status === "attention" &&
                  "border-amber-500/35 bg-amber-500/5",
              )}
            >
              <FindingIcon status={item.status} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.label}</p>
                <p className="text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {item.detail}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                  Source: {item.source}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
