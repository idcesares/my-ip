"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Code2, RefreshCw, ShieldCheck } from "lucide-react";
import { ActionBar } from "@/components/action-bar";
import { HistoryTable } from "@/components/history-table";
import { InfoGrid } from "@/components/info-grid";
import { IPAddressCard } from "@/components/ip-address-card";
import { LogoMark } from "@/components/logo-mark";
import { PrivacyAccordion } from "@/components/privacy-accordion";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBrowserDiagnostics } from "@/hooks/use-browser-diagnostics";
import { useHistory } from "@/hooks/use-history";
import { useIPInfo } from "@/hooks/use-ip-info";

export default function HomePage() {
  const { data: ipInfo, error, isLoading, mutate } = useIPInfo();
  const diagnostics = useBrowserDiagnostics();
  const history = useHistory();

  useEffect(() => {
    if (!ipInfo) return;
    const location = ipInfo.location
      ? [ipInfo.location.city, ipInfo.location.region, ipInfo.location.country].filter(Boolean).join(", ")
      : null;

    history.add({
      ip: ipInfo.ip,
      ipVersion: ipInfo.ipVersion,
      timestamp: ipInfo.timestamp,
      location,
    });
    // only push when IP changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipInfo?.ip]);

  return (
    <main id="main-content" className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-14 pt-6 md:px-6 md:pt-8">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="surface-card mb-10 rounded-3xl p-5 md:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <LogoMark />
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-[hsl(var(--background))/0.7] px-3 py-1 text-xs font-semibold tracking-wide text-[hsl(var(--muted-foreground))]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Privacy-First Diagnostics
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">What&apos;s My IP?</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))] md:text-base">
                Instant network visibility with no tracking. Real-time IP detection, browser telemetry, and clean exports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <a href="/api/ip" target="_blank" rel="noreferrer">
                <Code2 className="h-4 w-4" /> API
              </a>
            </Button>
            <Button variant="outline" size="icon" aria-label="Refresh data" onClick={() => mutate()}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      <section className="space-y-6">
        {isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Detecting IP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-72" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardHeader>
              <CardTitle>Request Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-[hsl(var(--destructive))]">Unable to fetch IP information right now.</p>
              <Button onClick={() => mutate()}>Retry</Button>
            </CardContent>
          </Card>
        )}

        {ipInfo && (
          <>
            <IPAddressCard data={ipInfo} />
            <ActionBar ip={ipInfo} browser={diagnostics} onRefresh={() => mutate()} />
          </>
        )}

        <InfoGrid data={diagnostics} />

        {ipInfo && (
          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="history">
              <Card>
                <CardContent className="pt-6">
                  <HistoryTable history={history.history} onClear={history.clear} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="raw">
              <Card>
                <CardContent className="pt-6">
                  <pre className="overflow-x-auto rounded-xl border bg-[hsl(var(--background))/0.55] p-4 text-xs">
                    {JSON.stringify(ipInfo, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <PrivacyAccordion />
      </section>

      <Separator className="my-10" />

      <footer className="pb-2 text-sm text-[hsl(var(--muted-foreground))]">
        <p>Privacy-first diagnostics. No analytics. No trackers. No server-side history.</p>
      </footer>
    </main>
  );
}