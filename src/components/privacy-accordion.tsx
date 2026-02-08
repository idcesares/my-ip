"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function PrivacyAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full rounded-lg border px-4">
      <AccordionItem value="privacy">
        <AccordionTrigger>Privacy Information</AccordionTrigger>
        <AccordionContent>
          Your IP address is not stored by this app. Browser diagnostics are computed locally on your device. No analytics, trackers, or server-side history storage is used.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="limitations">
        <AccordionTrigger>Known Limitations</AccordionTrigger>
        <AccordionContent>
          VPN, Tor, CGNAT, and corporate proxies can mask your origin IP. Geolocation is approximate and only available when explicitly requested.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}