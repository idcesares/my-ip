import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IPAddressCard } from "@/components/ip-address-card";
import type { IPInfo } from "@/types";

function ipInfo(overrides: Partial<IPInfo> = {}): IPInfo {
  return {
    ip: "203.0.113.9",
    ipVersion: "IPv4",
    ipv4: "203.0.113.9",
    ipv6: null,
    isPublic: true,
    source: "x-real-ip",
    confidence: "high",
    provenance: {
      provider: "vercel",
      header: "x-real-ip",
      trusted: true,
      forwarded: true,
    },
    category: "Public",
    timestamp: "2026-07-11T00:00:00.000Z",
    warnings: [],
    request: { userAgent: "test", language: "en", protocol: "https" },
    location: null,
    isp: null,
    ...overrides,
  };
}

describe("IPAddressCard", () => {
  it("says IPv6 is not observable on the IPv4-only Vercel host", () => {
    render(<IPAddressCard data={ipInfo()} />);
    expect(
      screen.getByText("Not observable: this site is served over IPv4 only"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
  });

  it("describes a missing family as not observed on other hosts", () => {
    render(
      <IPAddressCard
        data={ipInfo({
          provenance: {
            provider: "standard-forwarded",
            header: "x-real-ip",
            trusted: false,
            forwarded: true,
          },
        })}
      />,
    );
    expect(
      screen.getByText("Not observed on this request"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/served over IPv4 only/)).not.toBeInTheDocument();
  });

  it("shows both families when each is present", () => {
    render(<IPAddressCard data={ipInfo({ ipv6: "2001:db8::1" })} />);
    expect(screen.getByText("2001:db8::1")).toBeInTheDocument();
    expect(screen.queryByText(/Not observ/)).not.toBeInTheDocument();
  });

  it("requests location on demand and shows the loading state", async () => {
    let resolve!: () => void;
    const onFetchGeo = vi.fn(
      () =>
        new Promise<IPInfo>((done) => {
          resolve = () => done(ipInfo());
        }),
    );
    render(<IPAddressCard data={ipInfo()} onFetchGeo={onFetchGeo} />);

    fireEvent.click(screen.getByRole("button", { name: /show location/i }));
    expect(onFetchGeo).toHaveBeenCalledOnce();
    expect(
      await screen.findByRole("button", { name: /looking up location/i }),
    ).toBeDisabled();

    resolve();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /show location/i }),
      ).toBeEnabled(),
    );
  });

  it("renders location details once present", () => {
    render(
      <IPAddressCard
        data={ipInfo({
          location: {
            city: "Lisbon",
            region: "Lisboa",
            country: "PT",
            timezone: "Europe/Lisbon",
            coordinates: { latitude: null, longitude: null },
          },
        })}
      />,
    );
    expect(screen.getByText("Lisbon, PT")).toBeInTheDocument();
    expect(screen.getByText("Europe/Lisbon")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /show location/i }),
    ).not.toBeInTheDocument();
  });
});
