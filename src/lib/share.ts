export type ShareOutcome = "shared" | "copied" | "failed";

export interface ShareInput {
  title: string;
  text: string;
  url: string;
}

function copyWithExecCommand(text: string): boolean {
  if (typeof document === "undefined") return false;
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

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return copyWithExecCommand(text);
  }
}

/**
 * Tries the native share sheet first, then falls back to clipboard. The
 * clipboard fallback bundles url into text since there is no separate field
 * once the target is the clipboard rather than a share sheet.
 */
export async function shareReport(input: ShareInput): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(input);
      return "shared";
    } catch {
      // Fall through to the clipboard below.
    }
  }

  const copied = await copyToClipboard(`${input.text} | ${input.url}`);
  return copied ? "copied" : "failed";
}
