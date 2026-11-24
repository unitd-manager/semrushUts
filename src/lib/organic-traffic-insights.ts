export type OrganicInsightRow = { path: string; clicks: number | null; impressions: number | null; ctr: number | null; position: number | null; sessions: number | null; engagedSessions: number | null; conversions: number | null };
type Report = { rows?: unknown[]; dimensionHeaders?: { name?: string }[]; metricHeaders?: { name?: string }[] };

function numberOrNull(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizePagePath(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim() || value === "(not set)") return null;
  try {
    const url = new URL(value);
    return url.pathname || "/";
  } catch {
    const path = value.split(/[?#]/u)[0];
    return path.startsWith("/") ? path : `/${path}`;
  }
}

export function joinOrganicTrafficReports(searchConsoleValue: unknown, analyticsValue: unknown): OrganicInsightRow[] {
  const searchConsole = (searchConsoleValue && typeof searchConsoleValue === "object" ? searchConsoleValue : {}) as Report;
  const analytics = (analyticsValue && typeof analyticsValue === "object" ? analyticsValue : {}) as Report;
  const rows = new Map<string, OrganicInsightRow>();
  for (const value of searchConsole.rows ?? []) {
    if (!value || typeof value !== "object") continue;
    const row = value as { keys?: unknown[]; clicks?: unknown; impressions?: unknown; ctr?: unknown; position?: unknown };
    const path = normalizePagePath(row.keys?.[0]); if (!path) continue;
    const clicks = numberOrNull(row.clicks); const impressions = numberOrNull(row.impressions); const position = numberOrNull(row.position);
    const previous = rows.get(path);
    const totalClicks = (previous?.clicks ?? 0) + (clicks ?? 0);
    const totalImpressions = (previous?.impressions ?? 0) + (impressions ?? 0);
    const weightedPosition = ((previous?.position ?? 0) * (previous?.impressions ?? 0) + (position ?? 0) * (impressions ?? 0)) / (totalImpressions || 1);
    rows.set(path, { path, clicks: clicks !== null || (previous?.clicks ?? null) !== null ? totalClicks : null, impressions: impressions !== null || (previous?.impressions ?? null) !== null ? totalImpressions : null, ctr: totalImpressions ? totalClicks / totalImpressions : null, position: totalImpressions ? weightedPosition : null, sessions: previous?.sessions ?? null, engagedSessions: previous?.engagedSessions ?? null, conversions: previous?.conversions ?? null });
  }
  const metricNames = analytics.metricHeaders?.map((item) => item.name ?? "") ?? [];
  for (const value of analytics.rows ?? []) {
    if (!value || typeof value !== "object") continue;
    const row = value as { dimensionValues?: { value?: unknown }[]; metricValues?: { value?: unknown }[] };
    const path = normalizePagePath(row.dimensionValues?.[0]?.value); if (!path) continue;
    const existing = rows.get(path) ?? { path, clicks: null, impressions: null, ctr: null, position: null, sessions: null, engagedSessions: null, conversions: null };
    const metrics = new Map(metricNames.map((name, index) => [name, numberOrNull(row.metricValues?.[index]?.value)]));
    existing.sessions = metrics.get("sessions") ?? existing.sessions;
    existing.engagedSessions = metrics.get("engagedSessions") ?? existing.engagedSessions;
    existing.conversions = metrics.get("conversions") ?? existing.conversions;
    rows.set(path, existing);
  }
  return [...rows.values()].sort((a, b) => (b.clicks ?? -1) - (a.clicks ?? -1) || (b.sessions ?? -1) - (a.sessions ?? -1) || a.path.localeCompare(b.path));
}

export function propertyMatchesDomain(propertyId: string | null | undefined, domain: string): boolean {
  if (!propertyId || !domain) return false;
  const canonical = domain.toLowerCase().replace(/^www\./, "");
  if (propertyId.startsWith("sc-domain:")) return propertyId.slice("sc-domain:".length).toLowerCase().replace(/^www\./, "") === canonical;
  try { return new URL(propertyId).hostname.toLowerCase().replace(/^www\./, "") === canonical; }
  catch { return false; }
}
