"use client";

import { useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { AlertTriangle, MapPin, ShieldAlert } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import type { IPInfo } from "@/types";

// One HTTP request only reveals the address family it used, so a missing
// family means "not seen on this request", not "not supported".
const NOT_OBSERVED = "Not observed on this request";

interface IPAddressCardProps {
  data: IPInfo;
  onFetchGeo?: () => Promise<IPInfo>;
}

export function IPAddressCard({ data, onFetchGeo }: IPAddressCardProps) {
  const reduceMotion = useReducedMotion();
  const [geoLoading, setGeoLoading] = useState(false);

  return (
    <m.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="border-b border-[hsl(var(--border))] pb-6"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-[hsl(var(--border))] pb-4">
        <code className="min-w-0 break-all font-mono text-4xl font-bold tracking-tight [font-variant-numeric:tabular-nums] md:text-6xl">
          {data.ip}
        </code>
        <span className="self-center rounded border border-[hsl(var(--primary))] px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-[hsl(var(--primary))]">
          {data.ipVersion}
        </span>
        <div className="ml-auto self-center">
          <CopyButton value={data.ip} label={data.ipVersion} />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-3 text-sm text-[hsl(var(--muted-foreground))]">
        <span>
          Provider:{" "}
          <b className="font-semibold text-[hsl(var(--foreground))]">
            {data.provenance.provider}
          </b>
        </span>
        <span>
          Confidence:{" "}
          <b className="font-semibold text-[hsl(var(--foreground))]">
            {data.confidence}
          </b>
        </span>
        <span>
          Category:{" "}
          <b className="font-semibold text-[hsl(var(--foreground))]">
            {data.category}
          </b>
        </span>
        {data.location ? (
          <span>
            Location:{" "}
            <b className="font-semibold text-[hsl(var(--foreground))]">
              {[data.location.city, data.location.country]
                .filter(Boolean)
                .join(", ") || "Unknown"}
            </b>
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
            IPv4
          </p>
          <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[hsl(var(--border))] pb-2">
            <code className="min-w-0 flex-1 break-all font-mono text-sm [font-variant-numeric:tabular-nums] md:text-base">
              {data.ipv4 ?? NOT_OBSERVED}
            </code>
            <CopyButton value={data.ipv4} label="IPv4" />
          </div>
        </div>
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
            IPv6
          </p>
          <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[hsl(var(--border))] pb-2">
            <code className="min-w-0 flex-1 break-all font-mono text-sm [font-variant-numeric:tabular-nums] md:text-base">
              {data.ipv6 ?? NOT_OBSERVED}
            </code>
            <CopyButton value={data.ipv6} label="IPv6" />
          </div>
        </div>
      </div>

      {data.location ? (
        <div className="mt-4 grid gap-1 text-sm sm:grid-cols-2 md:grid-cols-4">
          <p className="text-[hsl(var(--muted-foreground))]">
            Region:{" "}
            <span className="font-medium text-[hsl(var(--foreground))]">
              {data.location.region ?? "Unknown"}
            </span>
          </p>
          {data.location.timezone && (
            <p className="text-[hsl(var(--muted-foreground))]">
              Timezone:{" "}
              <span className="font-medium text-[hsl(var(--foreground))]">
                {data.location.timezone}
              </span>
            </p>
          )}
          {data.isp?.name && (
            <p className="text-[hsl(var(--muted-foreground))]">
              ISP:{" "}
              <span className="font-medium text-[hsl(var(--foreground))]">
                {data.isp.name}
              </span>
            </p>
          )}
          {data.isp?.asn && (
            <p className="text-[hsl(var(--muted-foreground))]">
              ASN:{" "}
              <span className="font-medium text-[hsl(var(--foreground))]">
                {data.isp.asn}
              </span>
            </p>
          )}
        </div>
      ) : onFetchGeo ? (
        <Button
          variant="outline"
          className="mt-4 w-full"
          disabled={geoLoading}
          onClick={async () => {
            setGeoLoading(true);
            try {
              await onFetchGeo();
            } finally {
              setGeoLoading(false);
            }
          }}
        >
          <MapPin className="h-4 w-4" />
          {geoLoading ? "Looking up location…" : "Show Location"}
        </Button>
      ) : null}

      {data.warnings.length > 0 && (
        <ul className="mt-4 space-y-2 border border-[hsl(var(--destructive))]/40 bg-[hsl(var(--destructive))]/10 p-3 text-sm">
          {data.warnings.map((warning) => (
            <li key={warning} className="flex items-start gap-2">
              {warning.toLowerCase().includes("vpn") ? (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--destructive))]" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--destructive))]" />
              )}
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      )}
    </m.section>
  );
}
