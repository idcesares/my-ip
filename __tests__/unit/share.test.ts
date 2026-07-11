import { afterEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard, shareReport } from "@/lib/share";

const originalShare = navigator.share;
const originalClipboard = navigator.clipboard;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(navigator, "share", {
    value: originalShare,
    configurable: true,
  });
  Object.defineProperty(navigator, "clipboard", {
    value: originalClipboard,
    configurable: true,
  });
});

describe("copyToClipboard", () => {
  it("uses the async clipboard API when it succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await expect(copyToClipboard("hello")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("falls back to execCommand when the clipboard API rejects", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });
    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;

    await expect(copyToClipboard("hello")).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("falls back to execCommand when the clipboard API is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    document.execCommand = vi.fn().mockReturnValue(false);

    await expect(copyToClipboard("hello")).resolves.toBe(false);
  });
});

describe("shareReport", () => {
  const input = { title: "t", text: "some text", url: "https://example.com" };

  it("reports shared when navigator.share succeeds", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: share,
      configurable: true,
    });

    await expect(shareReport(input)).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith(input);
  });

  it("falls back to the clipboard when navigator.share rejects", async () => {
    Object.defineProperty(navigator, "share", {
      value: vi.fn().mockRejectedValue(new Error("cancelled")),
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    await expect(shareReport(input)).resolves.toBe("copied");
  });

  it("reports failed when neither share nor clipboard succeed", async () => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });
    document.execCommand = vi.fn().mockReturnValue(false);

    await expect(shareReport(input)).resolves.toBe("failed");
  });

  it("bundles the url into text for the clipboard fallback", async () => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await shareReport(input);
    expect(writeText).toHaveBeenCalledWith("some text | https://example.com");
  });
});
