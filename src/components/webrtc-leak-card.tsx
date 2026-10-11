"use client";

import { Eye, ShieldAlert, ShieldCheck, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WebRTCAssessment } from "@/lib/webrtc-diagnostics";

interface WebRTCLeakCardProps {
  assessment: WebRTCAssessment;
  scanning: boolean;
  onScan: () => void;
}

function AddressGroup({
  label,
  addresses,
}: {
  label: string;
  addresses: string[];
}) {
  if (addresses.length === 0) return null;
  return (
    <div>
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {addresses.map((address) => (
          <code
            key={address}
            className="max-w-full break-all border border-[hsl(var(--border))] px-2 py-0.5 font-mono text-xs [font-variant-numeric:tabular-nums]"
          >
            {address}
          </code>
        ))}
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<WebRTCAssessment["status"], string> = {
  "not-run": "Not tested",
  unavailable: "Unavailable",
  "none-observed": "None observed",
  "expected-address": "Expected address only",
  "unobservable-family": "IPv6 not comparable",
  "additional-exposure": "Additional exposure",
};

export function WebRTCLeakCard({
  assessment,
  scanning,
  onScan,
}: WebRTCLeakCardProps) {
  const hasRun = assessment.status !== "not-run";
  const isAttention = assessment.attention;
  const isNone = assessment.status === "none-observed";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Wifi
            aria-hidden="true"
            className="h-4 w-4 text-[hsl(var(--muted-foreground))]"
          />
          WebRTC address exposure test
          <Badge
            variant={isAttention ? "secondary" : "outline"}
            className={cn(
              "ml-auto rounded-full px-2 py-0.5 font-mono text-xs",
              isAttention &&
                "border-[hsl(var(--destructive))]/50 text-[hsl(var(--destructive))]",
            )}
          >
            {STATUS_LABEL[assessment.status]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3" aria-busy={scanning}>
        {!hasRun ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Compare WebRTC ICE candidate addresses with the public address used
            for this page request. The test contacts the configured public STUN
            servers.
          </p>
        ) : (
          <div className="space-y-3 text-sm" aria-live="polite">
            <div
              className={cn(
                "flex items-start gap-2 border p-3",
                isAttention &&
                  "border-[hsl(var(--destructive))]/35 bg-[hsl(var(--destructive))]/10",
                isNone && "border-[hsl(var(--ok))]/35 bg-[hsl(var(--ok))]/10",
                !isAttention && !isNone && "border-[hsl(var(--border))]",
              )}
            >
              {isAttention ? (
                <ShieldAlert
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--destructive))]"
                />
              ) : isNone ? (
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ok))]"
                />
              ) : (
                <Eye
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]"
                />
              )}
              <span>{assessment.summary}</span>
            </div>

            <AddressGroup
              label="Additional public addresses"
              addresses={assessment.additionalPublicAddresses}
            />
            <AddressGroup
              label="Public IPv6 addresses (this site cannot compare)"
              addresses={assessment.unobservableFamilyAddresses}
            />
            <AddressGroup
              label="Literal private addresses"
              addresses={assessment.privateAddresses}
            />
            <AddressGroup
              label="Current request address"
              addresses={assessment.expectedPublicAddresses}
            />
            <AddressGroup
              label="mDNS-masked host candidates"
              addresses={assessment.maskedHostnames}
            />
            <AddressGroup
              label="Other candidate identifiers"
              addresses={assessment.otherAddresses}
            />

            {assessment.timedOut && (
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                The five-second collection window ended before the browser
                signaled completion; shown candidates are partial.
              </p>
            )}
          </div>
        )}

        <Button
          variant="outline"
          className="min-h-11 w-full whitespace-normal"
          disabled={scanning}
          onClick={onScan}
        >
          {scanning
            ? "Collecting candidates…"
            : hasRun
              ? "Run again"
              : "Run WebRTC test"}
        </Button>
      </CardContent>
    </Card>
  );
}
