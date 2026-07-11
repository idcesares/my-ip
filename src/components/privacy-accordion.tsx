"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function PrivacyAccordion() {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full rounded-lg border px-4"
    >
      <AccordionItem value="privacy">
        <AccordionTrigger>Privacy Information</AccordionTrigger>
        <AccordionContent>
          Browser diagnostics are computed on this device. Up to 10 recent IP
          checks, timestamps, and optional location labels are stored in this
          browser&apos;s localStorage until you clear history or browser data.
          The app does not keep server-side history.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="limitations">
        <AccordionTrigger>Known Limitations</AccordionTrigger>
        <AccordionContent>
          VPN, Tor, CGNAT, and corporate networks can change the address visible
          to this site. Geolocation is approximate and only requested when you
          choose to show it. WebRTC results reflect one short browser test, not
          a guarantee.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="methodology">
        <AccordionTrigger>How diagnostics are measured</AccordionTrigger>
        <AccordionContent>
          Network Information values are rounded browser estimates. Page fetch
          is the total duration of a same-origin request, not network ping.
          Permission results are the effective state for this origin. The
          optional WebRTC test contacts public STUN servers and compares
          observed candidates with the address used for this page request.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
