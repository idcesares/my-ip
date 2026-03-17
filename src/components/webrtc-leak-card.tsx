"use client";

import { ShieldAlert, ShieldCheck, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WebRTCLeakResult } from "@/types";

interface WebRTCLeakCardProps {
  result: WebRTCLeakResult;
  scanning: boolean;
  onScan: () => void;
}

export function WebRTCLeakCard({ result, scanning, onScan }: WebRTCLeakCardProps) {
  const hasRun = result.supported || result.error !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wifi className="h-4 w-4 text-sky-500" />
          WebRTC Leak Test
          {hasRun && (
            <Badge variant={result.leaking ? "secondary" : "default"} className={`ml-auto rounded-full px-2 py-0.5 text-xs ${result.leaking ? "border-[hsl(var(--destructive))]/50 text-[hsl(var(--destructive))]" : ""}`}>
              {result.leaking ? "Leaking" : "No leak"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasRun && (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Check if your browser leaks your real IP via WebRTC (STUN requests).
          </p>
        )}

        {hasRun && result.error && (
          <p className="text-sm text-[hsl(var(--destructive))]">{result.error}</p>
        )}

        {hasRun && !result.error && (
          <div className="space-y-2 text-sm">
            {result.leaking ? (
              <div className="flex items-start gap-2 rounded-lg border border-[hsl(var(--destructive))]/35 bg-[hsl(var(--destructive))]/10 p-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Your browser exposes IP addresses via WebRTC even if you use a VPN.</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-500/35 bg-emerald-500/10 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>No WebRTC IP leak detected.</span>
              </div>
            )}

            {result.localIPs.length > 0 && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Local IPs exposed</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.localIPs.map((ip) => (
                    <code key={ip} className="rounded border px-2 py-0.5 text-xs">{ip}</code>
                  ))}
                </div>
              </div>
            )}

            {result.publicIPs.length > 0 && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Public IPs exposed</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.publicIPs.map((ip) => (
                    <code key={ip} className="rounded border px-2 py-0.5 text-xs">{ip}</code>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Button variant="outline" className="w-full" disabled={scanning} onClick={onScan}>
          {scanning ? "Scanning…" : hasRun ? "Re-scan" : "Run WebRTC Leak Test"}
        </Button>
      </CardContent>
    </Card>
  );
}
