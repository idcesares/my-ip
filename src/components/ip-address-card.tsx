"use client";

import { domAnimation, LazyMotion, m, useReducedMotion } from "framer-motion";
import { AlertTriangle, Globe, Radar, ShieldAlert, Waypoints } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IPInfo } from "@/types";

export function IPAddressCard({ data }: { data: IPInfo }) {
  const reduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
    <m.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="grain-overlay overflow-hidden border-[hsl(var(--primary))/0.2]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-xl md:text-2xl">
              <Radar className="h-5 w-5 text-sky-500" />
              Your IP Address
            </span>
            <Badge variant={data.isPublic ? "default" : "secondary"} className="rounded-full px-3 py-1">
              {data.ipVersion}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-[hsl(var(--background))/0.55] p-4">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">Primary IP</p>
              <code className="break-all text-2xl font-semibold tracking-tight md:text-4xl">{data.ip}</code>
            </div>
            <CopyButton value={data.ip} label={data.ipVersion} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border bg-[hsl(var(--background))/0.45] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                <Globe className="h-3.5 w-3.5" /> IPv4
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="break-all text-sm md:text-base">{data.ipv4 ?? "Unavailable"}</code>
                <CopyButton value={data.ipv4} label="IPv4" />
              </div>
            </div>
            <div className="rounded-xl border bg-[hsl(var(--background))/0.45] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                <Waypoints className="h-3.5 w-3.5" /> IPv6
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="break-all text-sm md:text-base">{data.ipv6 ?? "Unavailable"}</code>
                <CopyButton value={data.ipv6} label="IPv6" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-[hsl(var(--background))/0.45] p-3 text-sm">
            <div className="grid gap-1 md:grid-cols-2">
              <p className="text-[hsl(var(--muted-foreground))]">
                Detected from: <span className="font-medium text-[hsl(var(--foreground))]">{data.source}</span>
              </p>
              <p className="text-[hsl(var(--muted-foreground))]">
                Confidence: <span className="font-medium text-[hsl(var(--foreground))]">{data.confidence}</span>
              </p>
              <p className="text-[hsl(var(--muted-foreground))]">
                Category: <span className="font-medium text-[hsl(var(--foreground))]">{data.category}</span>
              </p>
              <p className="text-[hsl(var(--muted-foreground))]">
                Relay likely: <span className="font-medium text-[hsl(var(--foreground))]">{String(data.relayLikely)}</span>
              </p>
            </div>
          </div>

          {data.warnings.length > 0 && (
            <ul className="space-y-2 rounded-xl border border-[hsl(var(--destructive))]/35 bg-[hsl(var(--destructive))]/10 p-4 text-sm">
              {data.warnings.map((warning) => (
                <li key={warning} className="flex items-start gap-2">
                  {warning.toLowerCase().includes("vpn") ? (
                    <ShieldAlert className="mt-0.5 h-4 w-4" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                  )}
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </m.section>
    </LazyMotion>
  );
}
