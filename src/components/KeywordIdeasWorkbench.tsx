"use client";

import { useMemo, useState } from "react";
import { useAddGroupKeywordsMutation, useCreateKeywordGroupMutation, useKeywordGroupsQuery } from "@/lib/api";

type Idea = { phrase: string; searchVolume: number | null; cpc: number | null; competition: number | null; difficulty: number | null; intent: string | null; cluster: string | null };
type Country = "US" | "GB" | "CA" | "AU" | "IN";

export default function KeywordIdeasWorkbench({ rows, seed, country }: { rows: Idea[]; seed: string; country: Country }) {
  const [questionOnly, setQuestionOnly] = useState(false);
  const [include, setInclude] = useState("");
  const [exclude, setExclude] = useState("");
  const [minVolume, setMinVolume] = useState("");
  const [maxDifficulty, setMaxDifficulty] = useState("");
  const [maxCpc, setMaxCpc] = useState("");
  const [intent, setIntent] = useState("");
  const [cluster, setCluster] = useState("");
  const [matchType, setMatchType] = useState<"all" | "broad" | "phrase" | "exact">("all");
  const [sort, setSort] = useState<"volume" | "difficulty" | "cpc" | "phrase">("volume");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetList, setTargetList] = useState("");
  const [newListName, setNewListName] = useState("");
  const [message, setMessage] = useState("");
  const groups = useKeywordGroupsQuery({ kind: "LIST" });
  const [createGroup, createState] = useCreateKeywordGroupMutation();
  const [addKeywords, addState] = useAddGroupKeywordsMutation();
  const clusters = useMemo(() => [...new Set(rows.map((row) => row.cluster).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b)), [rows]);
  const filtered = useMemo(() => {
    const terms = include.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
    const exclusions = exclude.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
    return rows.filter((row) => {
      const phrase = row.phrase.toLocaleLowerCase();
      const seedText = seed.trim().toLocaleLowerCase();
      const seedWords = seedText.split(/\s+/u).filter(Boolean);
      if (matchType === "broad" && seedWords.some((word) => !phrase.includes(word))) return false;
      if (matchType === "phrase" && seedText && !phrase.includes(seedText)) return false;
      if (matchType === "exact" && phrase !== seedText) return false;
      if (questionOnly && !/^(how|what|when|where|why|who|which|can|could|do|does|is|are|should|will)\b/u.test(phrase)) return false;
      if (terms.some((word) => !phrase.includes(word)) || exclusions.some((word) => phrase.includes(word))) return false;
      if (minVolume && (row.searchVolume == null || row.searchVolume < Number(minVolume))) return false;
      if (maxDifficulty && (row.difficulty == null || row.difficulty > Number(maxDifficulty))) return false;
      if (maxCpc && (row.cpc == null || row.cpc > Number(maxCpc))) return false;
      if (intent && row.intent?.toLowerCase() !== intent) return false;
      if (cluster && row.cluster !== cluster) return false;
      return true;
    }).sort((a, b) => sort === "phrase" ? a.phrase.localeCompare(b.phrase) : sort === "difficulty" ? (a.difficulty ?? Infinity) - (b.difficulty ?? Infinity) : sort === "cpc" ? (b.cpc ?? -1) - (a.cpc ?? -1) : (b.searchVolume ?? -1) - (a.searchVolume ?? -1));
  }, [rows, seed, matchType, questionOnly, include, exclude, minVolume, maxDifficulty, maxCpc, intent, cluster, sort]);
  const summary = useMemo(() => {
    const volume = filtered.reduce((sum, row) => sum + (row.searchVolume ?? 0), 0);
    const difficultyRows = filtered.filter((row) => row.difficulty != null);
    const difficulty = difficultyRows.length ? Math.round(difficultyRows.reduce((sum, row) => sum + (row.difficulty ?? 0), 0) / difficultyRows.length) : null;
    const grouped = clusters.map((name) => { const items = rows.filter((row) => row.cluster === name); return { name, count: items.length, volume: items.reduce((sum, row) => sum + (row.searchVolume ?? 0), 0) }; }).sort((a, b) => b.volume - a.volume);
    return { volume, difficulty, grouped };
  }, [filtered, clusters, rows]);
  function toggle(phrase: string) {
    setSelected((current) => { const next = new Set(current); if (next.has(phrase)) next.delete(phrase); else next.add(phrase); return next; });
  }
  function exportCsv() {
    const quote = (value: unknown) => "\"" + String(value ?? "").replaceAll("\"", "\"\"") + "\"";
    const lines = [["Keyword", "Search volume", "Difficulty", "Intent", "CPC", "Competition", "Core keyword"], ...filtered.map((row) => [row.phrase, row.searchVolume, row.difficulty, row.intent, row.cpc, row.competition, row.cluster])];
    const url = URL.createObjectURL(new Blob([lines.map((line) => line.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "searchlight-keyword-ideas.csv"; anchor.click(); URL.revokeObjectURL(url);
  }
  async function saveSelected() {
    const phrases = filtered.filter((row) => selected.has(row.phrase)).map((row) => row.phrase);
    if (!phrases.length) return;
    try {
      let groupId = targetList;
      if (newListName.trim()) { const group = await createGroup({ name: newListName.trim(), kind: "LIST" }).unwrap(); groupId = group.data.id; setTargetList(groupId); setNewListName(""); }
      if (!groupId) { setMessage("Choose an existing keyword list or enter a new list name."); return; }
      for (let index = 0; index < phrases.length; index += 100) await addKeywords({ id: groupId, phrases: phrases.slice(index, index + 100), locale: ("en-" + country) as "en-US" | "en-GB" | "en-CA" | "en-AU" | "en-IN" }).unwrap();
      setMessage("Saved " + phrases.length + " selected keywords to the list."); setSelected(new Set());
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save the selected keywords."); }
  }
  return <>
    <div className="keyword-form keyword-form-row" aria-label="Keyword idea filters">
      <label>Include words<input value={include} onChange={(event) => setInclude(event.target.value)} placeholder="All words must match"/></label>
      <label>Exclude words<input value={exclude} onChange={(event) => setExclude(event.target.value)} placeholder="Remove matching ideas"/></label>
      <label>Minimum volume<input type="number" min="0" value={minVolume} onChange={(event) => setMinVolume(event.target.value)}/></label>
      <label>Maximum difficulty<input type="number" min="0" max="100" value={maxDifficulty} onChange={(event) => setMaxDifficulty(event.target.value)}/></label>
      <label>Maximum CPC<input type="number" min="0" step="any" value={maxCpc} onChange={(event) => setMaxCpc(event.target.value)}/></label>
      <label>Seed match<select value={matchType} onChange={(event) => setMatchType(event.target.value as typeof matchType)}><option value="all">All provider ideas</option><option value="broad">Broad · all seed words</option><option value="phrase">Phrase · exact phrase</option><option value="exact">Exact keyword</option></select></label>
      <label>Intent<select value={intent} onChange={(event) => setIntent(event.target.value)}><option value="">All intents</option>{["informational", "navigational", "commercial", "transactional"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Provider topic group<select value={cluster} onChange={(event) => setCluster(event.target.value)}><option value="">All groups</option>{clusters.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="volume">Volume</option><option value="difficulty">Difficulty</option><option value="cpc">CPC</option><option value="phrase">Keyword</option></select></label>
      <label className="charge-approval"><input type="checkbox" checked={questionOnly} onChange={(event) => setQuestionOnly(event.target.checked)}/><span>Questions only</span></label>
    </div>
    <div className="signal-strip"><div className="signal-label"><span><strong>{filtered.length}</strong><small>filtered ideas</small></span></div><div className="signal-label"><span><strong>{summary.volume.toLocaleString()}</strong><small>combined returned volume</small></span></div><div className="signal-label"><span><strong>{summary.difficulty ?? "—"}</strong><small>average returned difficulty</small></span></div><button className="button button-outline" onClick={exportCsv} disabled={!filtered.length}>Export filtered CSV</button></div>
    {summary.grouped.length > 0 && <div className="feature-card-grid">{summary.grouped.slice(0, 8).map((item) => <button type="button" className="panel feature-card" key={item.name} onClick={() => setCluster(cluster === item.name ? "" : item.name)}><p className="eyebrow">PROVIDER CORE KEYWORD</p><h3>{item.name}</h3><strong>{item.count} ideas · {item.volume.toLocaleString()} combined volume</strong></button>)}</div>}
    <div className="keyword-form keyword-group-create"><label>Save selection to list<select value={targetList} onChange={(event) => setTargetList(event.target.value)}><option value="">Choose a keyword list</option>{(groups.data?.data ?? []).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><label>Or create a new list<input value={newListName} onChange={(event) => setNewListName(event.target.value)} maxLength={100} placeholder="Keyword list name"/></label><button className="button button-primary" onClick={() => void saveSelected()} disabled={!selected.size || createState.isLoading || addState.isLoading}>{createState.isLoading || addState.isLoading ? "Saving…" : "Save " + selected.size + " selected"}</button></div>
    {message && <p className="research-message" role="status">{message}</p>}
    {filtered.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th><input type="checkbox" aria-label="Select filtered ideas" checked={filtered.length > 0 && filtered.every((row) => selected.has(row.phrase))} onChange={(event) => setSelected(event.target.checked ? new Set(filtered.map((row) => row.phrase)) : new Set())}/></th><th>Keyword</th><th>Volume</th><th>Difficulty</th><th>Intent</th><th>CPC</th><th>Competition</th><th>Core keyword</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.phrase}><td><input type="checkbox" aria-label={"Select " + row.phrase} checked={selected.has(row.phrase)} onChange={() => toggle(row.phrase)}/></td><td><strong>{row.phrase}</strong></td><td>{row.searchVolume?.toLocaleString() ?? "—"}</td><td>{row.difficulty ?? "—"}</td><td>{row.intent ?? "—"}</td><td>{row.cpc == null ? "—" : "$" + row.cpc.toFixed(2)}</td><td>{row.competition == null ? "—" : Math.round(row.competition * 100) + "%"}</td><td>{row.cluster ?? "—"}</td></tr>)}</tbody></table></div> : <p className="keyword-empty">No returned ideas match these filters.</p>}
    <p className="page-footer">Filters and totals apply only to this provider response (up to 100 ideas). Broad, phrase, and exact matching use literal text rules; related-keyword or SERP-feature classification is not inferred locally.</p>
  </>;
}
