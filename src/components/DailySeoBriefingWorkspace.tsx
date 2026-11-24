"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAiAgentsQuery, useDailySeoBriefingsQuery, useGenerateDailySeoBriefingMutation, useMeQuery, useProjectsQuery, useSaveDailySeoBriefingSettingsMutation, useCreateSeoOpsTaskFromSourceMutation } from "@/lib/api";

function apiMessage(error: unknown): string {
  if (error && typeof error === "object" && "data" in error) return (error as { data?: { error?: { message?: string } } }).data?.error?.message ?? "The request could not be completed.";
  return "The API could not be reached. Check the server and try again.";
}

function utcTime(hour: number, minute: number) { return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`; }

export default function DailySeoBriefingWorkspace() {
  const { data: projectsResult, isLoading: projectsLoading } = useProjectsQuery();
  const { data: identity } = useMeQuery();
  const { data: agents } = useAiAgentsQuery();
  const rootCauseAgent = agents?.data.find((agent) => agent.id === "seo-root-cause-investigator");
  const canManageSchedule = ["OWNER", "ADMIN", "MANAGER"].includes(identity?.organization.role ?? "");
  const canGenerate = ["OWNER", "ADMIN", "MANAGER", "ANALYST"].includes(identity?.organization.role ?? "");
  const projects = projectsResult?.data.filter((project) => project.status === "ACTIVE") ?? [];
  const [projectId, setProjectId] = useState("");
  const [time, setTime] = useState("08:00");
  const [enabled, setEnabled] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => { if (!projectId && projects.length) setProjectId(projects[0].id); }, [projectId, projects]);
  const query = useDailySeoBriefingsQuery({ projectId }, { skip: !projectId });
  const briefingData = query.currentData;
  useEffect(() => {
    if (!briefingData) return;
    const settings = briefingData.settings;
    setEnabled(settings?.enabled ?? false);
    setTime(utcTime(settings?.hourUtc ?? 8, settings?.minuteUtc ?? 0));
  }, [briefingData]);
  const [saveSettings, saving] = useSaveDailySeoBriefingSettingsMutation();
  const [generate, generating] = useGenerateDailySeoBriefingMutation();
  const [createSeoTask] = useCreateSeoOpsTaskFromSourceMutation();
  const selectedProject = useMemo(() => projects.find((project) => project.id === projectId), [projects, projectId]);
  const latest = briefingData?.data[0];
  const dateLabel = latest ? new Date(latest.generatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "No briefing generated yet";

  async function save() {
    if (!projectId || !canManageSchedule) return;
    const [hour, minute] = time.split(":").map(Number);
    setNotice(""); setErrorMessage("");
    try {
      await saveSettings({ projectId, enabled, hourUtc: hour, minuteUtc: minute }).unwrap();
      setNotice(enabled ? `Daily briefing scheduled for ${time} UTC.` : "Daily briefing schedule paused.");
    } catch (error) { setErrorMessage(apiMessage(error)); }
  }
  async function generateNow() {
    if (!projectId || !canGenerate) return;
    setNotice(""); setErrorMessage("");
    try {
      await generate({ projectId }).unwrap();
      setNotice("Today’s briefing is ready from saved workspace evidence.");
    } catch (error) { setErrorMessage(apiMessage(error)); }
  }

  return <div className="content-wrap daily-briefing-workspace">
    <div className="page-heading"><div><p className="eyebrow">SEO INTELLIGENCE / DAILY OPERATIONS</p><h1>Daily SEO Briefing</h1><p className="page-subtitle">Start with saved SEO evidence, see what needs attention, and jump into the right workflow.</p></div><button className="button button-primary" onClick={() => void generateNow()} disabled={!projectId || !canGenerate || generating.isLoading}>{generating.isLoading ? "Building briefing…" : "Generate today’s briefing"}</button></div>
    {notice && <div className="briefing-notice" role="status">{notice}</div>}{errorMessage && <div className="form-error" role="alert">{errorMessage}</div>}
    {projectsLoading ? <div className="module-status-card">Loading your websites…</div> : !projects.length ? <section className="module-status-card briefing-empty"><span className="module-large-icon">◎</span><h2>Add a website to begin</h2><p>Create a project and add its primary domain. The briefing will collect saved crawl and ranking evidence for that website.</p><Link className="button button-primary" href="/projects">Open website management</Link></section> : <>
      <section className="briefing-toolbar panel"><div className="briefing-project-select"><label htmlFor="briefing-project">Website / project</label><select id="briefing-project" value={projectId} onChange={(event) => { setProjectId(event.target.value); setNotice(""); }}><option value="" disabled>Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}{project.domains[0]?.host ? ` · ${project.domains[0].host}` : ""}</option>)}</select></div><div className="briefing-last-run"><span className="eyebrow">LATEST BRIEFING</span><strong>{dateLabel}</strong></div></section>
      <section className="briefing-settings panel"><div className="panel-heading"><div><p className="eyebrow">DAILY DELIVERY</p><h2>Schedule this briefing</h2><p>Creates and saves one evidence snapshot each day while the API is running.</p></div><span className={`report-status ${enabled ? "briefing-enabled" : ""}`}>{enabled ? "Scheduled" : "Paused"}</span></div><div className="briefing-settings-row"><label className="briefing-toggle"><input type="checkbox" checked={enabled} disabled={!canManageSchedule} onChange={(event) => setEnabled(event.target.checked)} /><span>Generate automatically every day</span></label><label className="briefing-time">Run time (UTC)<input type="time" value={time} onChange={(event) => setTime(event.target.value)} disabled={!enabled || !canManageSchedule} /></label><button className="button button-outline" onClick={() => void save()} disabled={!projectId || !canManageSchedule || saving.isLoading}>{saving.isLoading ? "Saving…" : "Save schedule"}</button></div><p className="briefing-footnote">{canManageSchedule ? "The scheduler runs with this platform’s API service. Saved briefs remain available in this dashboard." : "An owner, admin, or manager can change the automatic schedule."}</p></section>
      {query.isLoading ? <div className="module-status-card">Loading saved briefings…</div> : latest ? <>
        <section className="briefing-hero panel"><div><p className="eyebrow">{selectedProject?.name ?? "DAILY BRIEFING"} · {new Date(latest.briefDate).toLocaleDateString(undefined, { dateStyle: "full" })}</p><h2>{latest.data.headline}</h2><p>{latest.data.summary}</p></div><div className="briefing-hero-meta"><span className="briefing-pulse" /> Saved platform evidence</div></section>
        <section className="briefing-metrics">{latest.data.metrics.map((metric) => <article className="briefing-metric panel" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></article>)}</section>
        <div className="briefing-columns"><section className="panel briefing-panel"><div className="panel-heading"><div><p className="eyebrow">NEXT ACTIONS</p><h2>Priority follow-ups</h2></div><span className="report-row-count">{latest.data.priorities.length} items</span></div>{latest.data.priorities.length ? <div className="briefing-priorities">{latest.data.priorities.map((item, index) => <article key={`${item.title}-${index}`} className="briefing-priority"><span className={`briefing-priority-mark ${item.severity}`}>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><p>{item.detail}</p><small>{item.source}</small></div><div className="briefing-priority-actions"><Link href={item.href} aria-label={`Open ${item.source}`}>Open →</Link><button className="button button-outline" onClick={async () => { try { await createSeoTask({ sourceModule: "DAILY_SEO_BRIEFING", sourceEntityId: latest.id, itemIndex: index }).unwrap(); setNotice("Briefing priority imported into SEO Task Management with its evidence."); } catch (reason) { setErrorMessage(apiMessage(reason)); } }}>Create task</button></div></article>)}</div> : <div className="empty-state">No open follow-ups were found in saved data.</div>}</section>
          <aside className="briefing-side"><section className="panel briefing-panel"><div className="panel-heading"><div><p className="eyebrow">OBSERVED SIGNALS</p><h2>What changed in the data</h2></div></div>{latest.data.signals.length ? <div className="briefing-signals">{latest.data.signals.map((signal) => <article key={signal.title}><strong>{signal.title}</strong><p>{signal.detail}</p><small>{signal.source}{signal.observedAt ? ` · ${new Date(signal.observedAt).toLocaleDateString()}` : ""}</small></article>)}</div> : <div className="empty-state">No saved signals yet. Start with a Site Audit or Position Tracking.</div>}</section>
            <section className="panel briefing-panel"><div className="panel-heading"><div><p className="eyebrow">SOURCE COVERAGE</p><h2>Evidence included</h2></div></div><ul className="briefing-coverage">{latest.data.coverage.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul><nav className="briefing-links" aria-label="Related SEO modules"><Link href="/site-audit">Site Audit</Link><Link href="/rank-tracking">Position Tracking</Link><Link href="/on-page">On-page SEO</Link><Link href="/assistant">SEO assistant</Link>{rootCauseAgent && <Link href={`/${rootCauseAgent.route}?source=daily-seo-briefing&projectId=${projectId}`}>Investigate with AI</Link>}</nav></section></aside>
        </div>
        <section className="panel briefing-history"><div className="panel-heading"><div><p className="eyebrow">ARCHIVE</p><h2>Recent daily briefings</h2></div></div>{briefingData?.data.map((brief) => <div className={`briefing-history-row ${brief.id === latest.id ? "briefing-history-active" : ""}`} key={brief.id}><span><strong>{new Date(brief.briefDate).toLocaleDateString(undefined, { dateStyle: "medium" })}</strong><small>{brief.data.headline}</small></span><time>{new Date(brief.generatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</time></div>)}</section>
      </> : <section className="module-status-card briefing-empty"><span className="module-large-icon">☀</span><h2>Your first daily briefing starts here</h2><p>Generate one now to summarize saved audit findings, rankings, recommendations, and open tasks for {selectedProject?.name ?? "this project"}.</p><button className="button button-primary" onClick={() => void generateNow()} disabled={!canGenerate || generating.isLoading}>{generating.isLoading ? "Building briefing…" : "Generate first briefing"}</button></section>}
    </>}
  </div>;
}
