"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CopyButton({ value, label }: { value: string | null; label: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`Copied ${label} to clipboard!`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed. Please retry.");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={onCopy} disabled={!value} className="min-w-26">
      <motion.span
        key={copied ? "done" : "copy"}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="inline-flex items-center gap-1.5"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        <span>{copied ? "Copied" : `Copy ${label}`}</span>
      </motion.span>
    </Button>
  );
}