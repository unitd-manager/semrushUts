"use client";

import { FormEvent, useMemo, useState } from "react";
import { useGoogleReportMutation, useIntegrationsQuery, useProjectsQuery } from "@/lib/api";
import { joinOrganicTrafficReports, propertyMatchesDomain } from "@/lib/organic-traffic-insights";

const recentDate = (days: number) => { const value = new Date(); value.setDate(value.getDate() - days); return value.toISOString().slice(0, 10); };

export default function OrganicTrafficInsightsWorkspace() {
  const projects = useProjectsQuery(); const integrations = useIntegrationsQuery(); const [request, requestState] = useGoogleReportMutation();
  const [projectId, setProjectId] = useState(""); const [startDate, setStartDate] = useState(recentDate(28)); const [endDate, setEndDate] = useState(recentDate(1));
  const [gsc, setGsc] = useState<unknown>(null); const [ga, setGa] = useState<unknown>(null); const [message, setMessage] = useState("");
  const project = projects.data?.data.find((item) => item.id === projectId) ?? null;
  const host = project?.domains.find((domain) => domain.isPrimary)?.host ?? "";
  const gscIntegration = integrations.data?.data.find((item) => item.id === "google-search-console");
  const gaIntegration = integrations.data?.data.find((item) => item.id === "google-analytics");
  const propertyMatch = propertyMatchesDomain(gscIntegration?.account.id, host);
  const rows = useMemo(() => gsc || ga ? joinOrganicTrafficReports(gsc, ga) : [], [gsc, ga]);
  const today = new Date().toISOString().slice(0, 10);
  const canRun = Boolean(project && host && gscIntegration?.connected && gaIntegration?.connected && propertyMatch && startDate <= endDate && endDate < today);

  async function run(event: FormEvent) {
    event.preventDefault(); setMessage(""); setGsc(null); setGa(null);
    const [searchConsole, analytics] = await Promise.allSettled([
      request({ provider: "google-search-console", startDate, endDate, dimensions: ["page"] }).unwrap(),
      request({ provider: "google-analytics", startDate, endDate, dimensions: ["landingPage"], metrics: ["sessions", "engagedSessions", "conversions"] }).unwrap(),
    ]);
    let succeeded = 0;
    if (searchConsole.status === "fulfilled") { setGsc(searchConsole.value.data); succeeded++; }
    if (analytics.status === "fulfilled") { setGa(analytics.value.data); succeeded++; }
    setMessage(succeeded === 2 ? `Fetched first-party Google reports for ${host}. Page paths were joined; unmatched source rows remain visible with blank metrics.` : "A Google report failed. Check the connected account, selected property, and date range; any successful source rows are still shown.");
  }

  function exportCsv() {
    const cell = (value: string | number | null) => { let text = String(value ?? ""); if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; };
    const records = [["Page path", "GSC clicks", "GSC impressions", "GSC CTR", "GSC average position", "GA4 sessions", "GA4 engaged sessions", "GA4 conversions"], ...rows.map((row) => [row.path, row.clicks, row.impressions, row.ctr, row.position, row.sessions, row.engagedSessions, row.conversions])];
    const href = URL.createObjectURL(new Blob([records.map((line) => line.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = href; anchor.download = "organic-traffic-insights.csv"; anchor.click(); URL.revokeObjectURL(href);
  }

  const reportError = requestState.error ? "Google did not return one or more reports. Review the connection and selected property in Settings." : "";
  return <div className="content-wrap">
    <div className="page-heading"><div><p className="eyebrow">SEO / FIRST-PARTY ANALYTICS</p><h1>Organic Traffic Insights</h1><p className="page-subtitle">Join Search Console page clicks with GA4 landing page sessions for a selected project.</p></div></div>
    <div className="settings-notice"><strong>First-party Google reports only</strong><p>Both integrations must be connected with accounts selected. The Search Console property is checked against the project domain. GA4 uses the organization’s selected property; confirm it in Integrations. No estimated or sample traffic is used.</p></div>
    <section className="panel keyword-query-panel"><form className="feature-form" onSubmit={(event) => void run(event)}>
      <label>Project and primary domain<select required value={projectId} onChange={(event) => { setProjectId(event.target.value); setGsc(null); setGa(null); }}><option value="">Choose project</option>{(projects.data?.data ?? []).filter((item) => item.domains.some((domain) => domain.isPrimary)).map((item) => <option value={item.id} key={item.id}>{item.name} · {item.domains.find((domain) => domain.isPrimary)?.host}</option>)}</select></label>
      <div className="feature-form"><label>Start date<input type="date" required value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)}/></label><label>End date<input type="date" required value={endDate} max={recentDate(1)} onChange={(event) => setEndDate(event.target.value)}/></label></div>
      <section className="settings-notice"><strong>Google Search Console</strong><p>{gscIntegration?.connected ? `${gscIntegration.account.name ?? "Connected property"} · ${propertyMatch ? "matches selected project domain" : "selected property does not match this project"}` : `${gscIntegration?.status ?? "Checking connection"}. Connect and select a property in Integrations.`}</p><strong>Google Analytics 4</strong><p>{gaIntegration?.connected ? `${gaIntegration.account.name ?? "Property selected"} · verify that this is the selected project’s GA4 property` : `${gaIntegration?.status ?? "Checking connection"}. Connect and select a property in Integrations.`}</p><a href="/settings" className="text-button">Manage integrations →</a></section>
      <button className="button button-primary" disabled={!canRun || requestState.isLoading}>{requestState.isLoading ? "Fetching Google reports…" : "Run organic insights"}</button>
    </form>{message && <p className="research-message" role="status">{message}</p>}{reportError && <p className="form-error" role="alert">{reportError}</p>}</section>
    {Boolean(gsc || ga) && <section className="panel keyword-results-panel"><div className="panel-heading keyword-results-heading"><div><p className="eyebrow">{project?.name} / {host}</p><h2>Landing page comparison <span className="count-chip">{rows.length}</span></h2></div><button className="button button-outline" onClick={exportCsv} disabled={!rows.length}>Export CSV</button></div><p>Values are provider-reported for {startDate} through {endDate}. Missing values indicate that a source did not return a matching page.</p><div className="table-scroll"><table className="data-table"><thead><tr><th>Page path</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Avg position</th><th>Sessions</th><th>Engaged</th><th>Conversions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.path}><td>{row.path}</td><td>{row.clicks?.toLocaleString() ?? "—"}</td><td>{row.impressions?.toLocaleString() ?? "—"}</td><td>{row.ctr == null ? "—" : `${(row.ctr * 100).toFixed(2)}%`}</td><td>{row.position?.toFixed(1) ?? "—"}</td><td>{row.sessions?.toLocaleString() ?? "—"}</td><td>{row.engagedSessions?.toLocaleString() ?? "—"}</td><td>{row.conversions?.toLocaleString() ?? "—"}</td></tr>)}</tbody></table></div></section>}
  </div>;
}
