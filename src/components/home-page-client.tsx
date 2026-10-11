"use client";

import { useState } from "react";
import { domAnimation, LazyMotion, m } from "framer-motion";
import { Code2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ActionBar } from "@/components/action-bar";
import { HistoryTable } from "@/components/history-table";
import { InfoGrid } from "@/components/info-grid";
import { IPAddressCard } from "@/components/ip-address-card";
import { LogoMark } from "@/components/logo-mark";
import { PrivacyAccordion } from "@/components/privacy-accordion";
import { DiagnosticFindingsCard } from "@/components/privacy-score-card";
import { WebRTCLeakCard } from "@/components/webrtc-leak-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBrowserDiagnostics } from "@/hooks/use-browser-diagnostics";
import { useHistory, useHistoryRecorder } from "@/hooks/use-history";
import { useIPInfo } from "@/hooks/use-ip-info";
import { useDiagnosticAssessment } from "@/hooks/use-privacy-score";
import { useWebRTCLeak } from "@/hooks/use-webrtc-leak";

export function HomePageClient() {
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const { data: ipInfo, error, isLoading, mutate, fetchGeo } = useIPInfo();
  const diagnostics = useBrowserDiagnostics(showAdvancedMetrics);
  const { history, add, clear } = useHistory();
  const webrtc = useWebRTCLeak(ipInfo ?? null);
  const diagnosticAssessment = useDiagnosticAssessment(
    ipInfo ?? null,
    diagnostics,
    webrtc.assessment,
  );

  useHistoryRecorder(ipInfo ?? null, add, (change) => {
    toast.info("IP address changed", {
      description: `${change.from} → ${change.to}`,
    });
  });

  return (
    <LazyMotion features={domAnimation}>
      <main
        id="main-content"
        className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-14 pt-6 md:px-6 md:pt-8"
      >
        <m.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[hsl(var(--border))] pb-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark />
            <h1 className="truncate font-mono text-xs font-bold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
              What&apos;s My IP — Network Diagnostics
            </h1>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button asChild variant="outline" className="min-h-11">
              <a href="/api/ip" target="_blank" rel="noreferrer">
                <Code2 className="h-4 w-4" /> API
              </a>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              aria-label={isLoading ? "Refreshing data" : "Refresh data"}
              disabled={isLoading}
              onClick={() => mutate()}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <ThemeToggle />
          </div>
        </m.header>

        <div className="mb-6">
          <p className="mb-1.5 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
            <span className="eyebrow-dot" aria-hidden="true" /> Live · No
            tracking · No analytics
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))] md:text-base">
            Instant IP visibility with browser-reported network, security, and
            privacy signals for this connection.
          </p>
        </div>

        <section className="space-y-6" aria-busy={isLoading}>
          {isLoading && (
            <Card role="status" aria-live="polite">
              <CardHeader>
                <CardTitle>Detecting IP</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-full max-w-72" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          )}

          {error && (
            <Card role="alert">
              <CardHeader>
                <CardTitle>Request Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-[hsl(var(--destructive))]">
                  Unable to fetch IP information right now.
                </p>
                <Button onClick={() => mutate()}>Retry</Button>
              </CardContent>
            </Card>
          )}

          {ipInfo && (
            <>
              <IPAddressCard data={ipInfo} onFetchGeo={fetchGeo} />
              <ActionBar
                ip={ipInfo}
                browser={diagnostics}
                onRefresh={() => mutate()}
              />
            </>
          )}

          <InfoGrid
            data={diagnostics}
            showAdvanced={showAdvancedMetrics}
            onToggleAdvanced={() => setShowAdvancedMetrics((value) => !value)}
          />

          <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
            Secondary checks
          </p>

          <WebRTCLeakCard
            assessment={webrtc.assessment}
            scanning={webrtc.scanning}
            onScan={webrtc.scan}
          />

          {diagnosticAssessment && (
            <DiagnosticFindingsCard assessment={diagnosticAssessment} />
          )}

          {ipInfo && (
            <Tabs defaultValue="history">
              <TabsList>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="raw">Raw JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="history">
                <Card>
                  <CardContent className="pt-6">
                    <HistoryTable history={history} onClear={clear} />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="raw">
                <Card>
                  <CardContent className="pt-6">
                    <pre className="overflow-x-auto rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 text-xs">
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
          <p className="mb-2">
            Privacy-first diagnostics. No analytics. No trackers. No server-side
            history.
          </p>
          <p>
            © {new Date().getFullYear()} Isaac D&apos;Césares @{" "}
            <a
              className="underline underline-offset-4 hover:text-[hsl(var(--foreground))]"
              href="https://dcesares.dev"
              target="_blank"
              rel="noreferrer"
            >
              dcesares.dev
            </a>{" "}
            · Open source project at{" "}
            <a
              className="underline underline-offset-4 hover:text-[hsl(var(--foreground))]"
              href="https://github.com/idcesares/my-ip"
              target="_blank"
              rel="noreferrer"
            >
              github.com/idcesares/my-ip
            </a>
            .
          </p>
        </footer>
      </main>
    </LazyMotion>
  );
}
