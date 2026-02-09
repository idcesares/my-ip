"use client";

import { Download, RefreshCw, Share2 } from "lucide-react";
import { domAnimation, LazyMotion, m } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildTextReport, downloadFile, timestampName } from "@/lib/export";
import type { BrowserDiagnostics, IPInfo } from "@/types";

export function ActionBar({
  ip,
  browser,
  onRefresh,
}: {
  ip: IPInfo;
  browser: BrowserDiagnostics | null;
  onRefresh: () => void;
}) {
  const exportJson = () => {
    downloadFile(
      `ip-info-${timestampName()}.json`,
      JSON.stringify({ ip, browser, exportedAt: new Date().toISOString() }, null, 2),
      "application/json",
    );
    toast.success("Exported JSON report.");
  };

  const exportTxt = () => {
    downloadFile(`ip-info-${timestampName()}.txt`, buildTextReport(ip, browser), "text/plain;charset=utf-8");
    toast.success("Exported text report.");
  };

  const copyToClipboardWithFallback = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(input);
      return copied;
    }
  };

  const share = async () => {
    const shareText = `My IP: ${ip.ip} | Browser: ${browser?.userAgent ?? "Unknown"} | Location: ${ip.location?.city ?? "Unknown"}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "What's My IP", text: shareText, url: window.location.href });
        return;
      } catch {
        // fallback to clipboard below
      }
    }

    const copied = await copyToClipboardWithFallback(`${shareText} | ${window.location.href}`);
    if (copied) {
      toast.success("Share details copied to clipboard.");
      return;
    }

    toast.error("Unable to share or copy automatically.");
  };

  return (
    <LazyMotion features={domAnimation}>
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 }}
      className="surface-card rounded-2xl p-3"
    >
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={share}><Share2 className="h-4 w-4" />Share Results</Button>
        <Button variant="outline" onClick={exportJson}><Download className="h-4 w-4" />Export JSON</Button>
        <Button variant="outline" onClick={exportTxt}><Download className="h-4 w-4" />Export TXT</Button>
        <Button variant="secondary" onClick={onRefresh}><RefreshCw className="h-4 w-4" />Refresh</Button>
      </div>
    </m.div>
    </LazyMotion>
  );
}
