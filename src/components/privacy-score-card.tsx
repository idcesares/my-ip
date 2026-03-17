"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PrivacyCheckResult, PrivacyScore } from "@/types";

interface PrivacyScoreCardProps {
  score: PrivacyScore;
}

type Grade = PrivacyScore["grade"];

const GRADE_STYLES: Record<Grade, string> = {
  "A+": "text-emerald-500",
  A: "text-emerald-500",
  B: "text-sky-500",
  C: "text-amber-500",
  D: "text-orange-500",
  F: "text-red-500",
};

const RING_COLORS: Record<Grade, string> = {
  "A+": "stroke-emerald-500",
  A: "stroke-emerald-500",
  B: "stroke-sky-500",
  C: "stroke-amber-500",
  D: "stroke-orange-500",
  F: "stroke-red-500",
};

function ScoreRing({ score, grade }: { score: number; grade: Grade }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="6"
          className="stroke-[hsl(var(--muted))]"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700", RING_COLORS[grade])}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("text-2xl font-bold", GRADE_STYLES[grade])}>
          {grade}
        </span>
        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{score}/100</span>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: PrivacyCheckResult["status"] }) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />;
  return <XCircle className="h-4 w-4 shrink-0 text-red-500" />;
}

export function PrivacyScoreCard({ score }: PrivacyScoreCardProps) {
  const passCount = score.checks.filter((c) => c.status === "pass").length;
  const failCount = score.checks.filter((c) => c.status === "fail").length;
  const warnCount = score.checks.filter((c) => c.status === "warn").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            {score.overall >= 70 ? (
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            ) : (
              <ShieldX className="h-4 w-4 text-amber-500" />
            )}
            Privacy Score
          </span>
          <div className="flex gap-1.5">
            {passCount > 0 && (
              <Badge variant="outline" className="gap-1 text-emerald-500">
                {passCount} pass
              </Badge>
            )}
            {warnCount > 0 && (
              <Badge variant="outline" className="gap-1 text-amber-500">
                {warnCount} warn
              </Badge>
            )}
            {failCount > 0 && (
              <Badge variant="outline" className="gap-1 text-red-500">
                {failCount} fail
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <ScoreRing score={score.overall} grade={score.grade} />
          <div className="flex-1 space-y-1.5 text-sm">
            <p className="text-[hsl(var(--muted-foreground))]">
              Your privacy posture based on connection, browser settings, and detected leaks.
            </p>
            {score.overall >= 85 && (
              <p className="text-emerald-500">Strong privacy configuration detected.</p>
            )}
            {score.overall >= 55 && score.overall < 85 && (
              <p className="text-amber-500">Some privacy improvements are recommended.</p>
            )}
            {score.overall < 55 && (
              <p className="text-red-500">Significant privacy concerns detected.</p>
            )}
          </div>
        </div>

        {score.consistencyIssues.length > 0 && (
          <div className="space-y-2 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Consistency Issues
            </p>
            <ul className="space-y-1 text-sm">
              {score.consistencyIssues.map((issue) => (
                <li key={issue} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-1.5">
          {score.checks.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-2.5 rounded-lg border bg-[hsl(var(--background))/0.45] px-3 py-2 text-sm"
            >
              <StatusIcon status={c.status} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.label}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
