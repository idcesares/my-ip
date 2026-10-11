"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  collectBaseSnapshot,
  getConnection,
  getPermissions,
  networkSignature,
  probeCurrentPage,
} from "@/lib/browser-snapshot";
import type { BrowserDiagnosticsSnapshot } from "@/types";

export function useBrowserDiagnostics(enableAdvanced: boolean) {
  const [data, setData] = useState<BrowserDiagnosticsSnapshot | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const lastNetworkSignature = useRef<string | null>(null);
  const lastConnectionChangedAt = useRef<string | null>(null);
  const probeRun = useRef(0);

  const collectBase = useCallback((): BrowserDiagnosticsSnapshot => {
    const signature = networkSignature(getConnection());
    if (
      lastNetworkSignature.current &&
      lastNetworkSignature.current !== signature
    ) {
      lastConnectionChangedAt.current = new Date().toISOString();
    }
    lastNetworkSignature.current = signature;
    return collectBaseSnapshot(lastConnectionChangedAt.current);
  }, []);

  /** Re-reads synchronous signals while keeping the async measurements. */
  const populate = useCallback(() => {
    const next = collectBase();
    setData((current) =>
      current
        ? {
            ...next,
            connection: {
              ...next.connection,
              pageFetchMs: current.connection.pageFetchMs,
              pageFetchMinMs: current.connection.pageFetchMinMs,
              pageFetchSamples: current.connection.pageFetchSamples,
            },
            privacy: {
              ...next.privacy,
              permissions: current.privacy.permissions,
            },
            security: current.security,
          }
        : next,
    );
  }, [collectBase]);

  const refreshHeaderProbe = useCallback(async () => {
    // A newer run supersedes an older one that is still in flight.
    const run = ++probeRun.current;
    setMeasuring(true);
    const probe = await probeCurrentPage();
    if (run !== probeRun.current) return;
    setData((current) =>
      current
        ? {
            ...current,
            connection: {
              ...current.connection,
              pageFetchMs: probe.pageFetchMs,
              pageFetchMinMs: probe.pageFetchMinMs,
              pageFetchSamples: probe.samples,
            },
            security: {
              ...current.security,
              responseHeaders: probe.responseHeaders,
              responseHeadersStatus: probe.status,
              probedAt: probe.probedAt,
            },
          }
        : current,
    );
    setMeasuring(false);
  }, []);

  const remeasure = useCallback(() => {
    populate();
    void refreshHeaderProbe();
  }, [populate, refreshHeaderProbe]);

  useEffect(() => {
    const onOnline = () => {
      populate();
      void refreshHeaderProbe();
    };

    const initialFrame = window.requestAnimationFrame(() => {
      populate();
      void refreshHeaderProbe();
    });
    window.addEventListener("resize", populate);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", populate);

    const connection = getConnection();
    connection?.addEventListener?.("change", populate);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("resize", populate);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", populate);
      connection?.removeEventListener?.("change", populate);
    };
  }, [populate, refreshHeaderProbe]);

  useEffect(() => {
    if (!enableAdvanced) return;
    let cancelled = false;
    void getPermissions().then((permissions) => {
      if (cancelled) return;
      setData((current) =>
        current
          ? { ...current, privacy: { ...current.privacy, permissions } }
          : current,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [enableAdvanced]);

  return { data, measuring, remeasure };
}
