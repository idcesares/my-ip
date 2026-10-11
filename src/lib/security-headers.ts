export interface HeaderSummary {
  /** Short, factual description shown next to "Present". */
  text: string;
  /** True when the header is present but carries a notable weakness. */
  weak: boolean;
}

function directives(csp: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const part of csp.split(";")) {
    const [name, ...tokens] = part.trim().split(/\s+/);
    if (name) map.set(name.toLowerCase(), tokens);
  }
  return map;
}

/**
 * Describes what a Content-Security-Policy allows for scripts. Presence alone
 * says little: a policy that permits inline scripts or eval gives much weaker
 * protection against script injection than one that does not.
 */
export function summarizeCsp(value: string): HeaderSummary {
  const all = directives(value);
  const scriptSources = all.get("script-src") ?? all.get("default-src");

  if (!scriptSources) {
    return { text: "Present · does not restrict scripts", weak: true };
  }

  const lower = scriptSources.map((token) => token.toLowerCase());
  const protectedInline = lower.some(
    (token) =>
      token === "'strict-dynamic'" || /^'(nonce|sha(256|384|512))-/.test(token),
  );
  const flags: string[] = [];
  if (lower.includes("'unsafe-inline'") && !protectedInline) {
    flags.push("allows inline scripts");
  }
  if (lower.includes("'unsafe-eval'")) flags.push("allows eval");
  if (
    lower.some(
      (token) => token === "*" || token === "https:" || token === "http:",
    )
  ) {
    flags.push("allows scripts from any origin");
  }

  return flags.length > 0
    ? { text: `Present · ${flags.join(", ")}`, weak: true }
    : { text: "Present · restricts script sources", weak: false };
}

/** Splits `a=(), b=(self "https://x")` on top-level commas. */
function permissionsPolicyEntries(value: string): [string, string][] {
  const entries: [string, string][] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth++;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === "," && depth === 0) {
      entries.push([current, ""]);
      current = "";
    } else {
      current += char;
    }
  }
  entries.push([current, ""]);

  return entries
    .map(([entry]) => entry.trim())
    .filter(Boolean)
    .map((entry): [string, string] => {
      const separator = entry.indexOf("=");
      return separator === -1
        ? [entry.toLowerCase(), ""]
        : [
            entry.slice(0, separator).trim().toLowerCase(),
            entry.slice(separator + 1).trim(),
          ];
    });
}

/** Feature names a Permissions-Policy disables entirely (`feature=()`). */
export function disabledPermissionFeatures(value: string | null): Set<string> {
  if (!value) return new Set();
  return new Set(
    permissionsPolicyEntries(value)
      .filter(([, allowlist]) => /^\(\s*\)$/.test(allowlist))
      .map(([feature]) => feature),
  );
}

export function summarizePermissionsPolicy(value: string): HeaderSummary {
  const disabled = disabledPermissionFeatures(value);
  const total = permissionsPolicyEntries(value).length;
  const text =
    disabled.size > 0
      ? `Present · disables ${[...disabled].sort().join(", ")}`
      : `Present · ${total} feature${total === 1 ? "" : "s"} configured`;
  return { text, weak: false };
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

function duration(seconds: number): string {
  if (seconds >= 31_536_000) {
    return plural(Math.round((seconds / 31_536_000) * 10) / 10, "year");
  }
  if (seconds >= 86_400) return plural(Math.round(seconds / 86_400), "day");
  return plural(seconds, "second");
}

export function summarizeHsts(value: string): HeaderSummary {
  const parts = value.split(";").map((part) => part.trim().toLowerCase());
  const maxAge = parts
    .map((part) => /^max-age=(\d+)$/.exec(part))
    .find((match) => match !== null);
  const seconds = maxAge ? Number(maxAge[1]) : null;
  const details = [
    seconds === null ? "no max-age" : `max-age ${duration(seconds)}`,
    parts.includes("includesubdomains") ? "includeSubDomains" : null,
    parts.includes("preload") ? "preload" : null,
  ].filter(Boolean);
  return {
    text: `Present · ${details.join(", ")}`,
    weak: seconds === null || seconds === 0,
  };
}

/** Headers whose value is already short and meaningful are shown verbatim. */
export function summarizeVerbatim(value: string): HeaderSummary {
  return { text: `Present · ${value.trim()}`, weak: false };
}
