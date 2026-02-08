"use client";

import { motion } from "framer-motion";
import { Globe2, MonitorCog, ShieldCheck } from "lucide-react";
import type { BrowserDiagnostics } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Row({ k, v }: { k: string; v: string | number | boolean | null }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-[hsl(var(--muted-foreground))]">{k}</span>
      <span className="text-right font-semibold">{String(v ?? "N/A")}</span>
    </div>
  );
}

export function InfoGrid({ data }: { data: BrowserDiagnostics | null }) {
  if (!data) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Card><CardContent className="h-44" /></Card>
        <Card><CardContent className="h-44" /></Card>
        <Card><CardContent className="h-44" /></Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      className="grid gap-4 lg:grid-cols-3"
    >
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-sky-500" />Network Information</CardTitle></CardHeader>
        <CardContent>
          <Row k="Online" v={data.online} />
          <Row k="Type" v={data.connection.effectiveType} />
          <Row k="Downlink" v={data.connection.downlink ? `${data.connection.downlink} Mbps` : null} />
          <Row k="RTT" v={data.connection.rtt ? `${data.connection.rtt} ms` : null} />
          <Row k="Data Saver" v={data.connection.saveData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MonitorCog className="h-4 w-4 text-cyan-500" />Browser Details</CardTitle></CardHeader>
        <CardContent>
          <Row k="Language" v={data.languages[0]} />
          <Row k="Timezone" v={data.timezone} />
          <Row k="Viewport" v={data.viewport} />
          <Row k="Screen" v={data.screenResolution} />
          <Row k="Color Depth" v={data.colorDepth} />
          <Row k="Pixel Ratio" v={data.pixelRatio} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" />Privacy & Security</CardTitle></CardHeader>
        <CardContent>
          <Row k="Color Scheme" v={data.preferences.colorScheme} />
          <Row k="Reduced Motion" v={data.preferences.reducedMotion} />
          <Row k="High Contrast" v={data.preferences.highContrast} />
          <Row k="Touch" v={data.preferences.touchCapable} />
          <Row k="Cookies" v={data.preferences.cookieEnabled} />
          <Row k="DNT" v={data.preferences.doNotTrack} />
          <Row k="Protocol" v={data.security.protocol} />
        </CardContent>
      </Card>
    </motion.div>
  );
}