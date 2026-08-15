import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Search,
  ArrowRight,
  ArrowLeft,
  Link2,
  ThumbsUp,
  ThumbsDown,
  FileSearch,
  RotateCcw,
  ExternalLink,
  Globe,
} from "lucide-react";
import { translations, LANGUAGE_ORDER } from "./translations";
import { supabase } from "./supabaseClient";

const INK = "#12141C";
const PAPER = "#EDEAE0";
const ALARM = "#FF4F4F";
const CAUTION = "#FFB020";
const VERIFIED = "#35C488";
const SLATE = "#8A8F9E";

const WHERE_OPTIONS = ["YouTube", "Instagram", "TikTok", "TV", "Facebook"];

function getInitialLang() {
  try {
    const saved = window.localStorage.getItem("sc-lang");
    if (saved && translations[saved]) return saved;
    const browser = (navigator.language || "en").slice(0, 2);
    if (translations[browser]) return browser;
  } catch (e) {
    // ignore
  }
  return "en";
}

function buildSystemPrompt(t, langName) {
  return `You are ScamCheck, a research assistant that investigates advertisements for a consumer safety app.

You will be given a description of an ad someone saw, where they saw it, and optionally a link. Either a description or a link will always be present — if only a link is given, treat the link itself as the subject and research the company/product it points to.

Search the web for independent reviews, complaints, refund/chargeback reports, fact-checks of specific claims, and any scam or fraud reports connected to this product or company. Also look for genuine positive evidence (independent testing, verified buyer reports, reputable coverage). Be efficient: use 1-3 targeted searches rather than many broad ones, and favor sources whose preview snippet already answers the question over ones that require opening the full page.

Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "verdict": "trust" | "caution" | "avoid" | "unknown",
  "summary": "one plain sentence explaining the verdict",
  "positives": [{"text": "specific finding, one sentence", "src": "publication or site name", "url": "https://..."}],
  "negatives": [{"text": "specific finding, one sentence", "src": "publication or site name", "url": "https://..."}]
}

Rules:
- Write every "summary", "text", and "src" value in ${langName}, regardless of what language the input is in. Only the JSON keys themselves stay in English.
- Use "unknown" only if you genuinely cannot find enough information after searching — do not invent findings to fill space.
- positives: 0 to 4 items. negatives: 0 to 5 items. Every item must reflect something you actually found, not ad copy or assumptions.
- "src" should be a real, specific outlet or source name (e.g. "Better Business Bureau", "Reddit r/scams", "Wirecutter"), not a generic label.
- "url" must be the real, exact URL of the page you found that finding on. Never invent or guess a URL — if you don't have the real URL for a finding, omit that finding entirely rather than including a fake or best-guess link.
- Base the verdict on the weight of real evidence, not on how the ad sounds.
- Keep each "text" under 25 words.`;
}

function FontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans:wght@400;500;700&family=Noto+Sans+Arabic:wght@400;500;700&family=Noto+Sans+Hebrew:wght@400;500;700&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Sans+Devanagari:wght@400;500;700&family=Noto+Sans+Bengali:wght@400;500;700&display=swap');
      .sc-display { font-family: 'Space Grotesk', 'Noto Sans', 'Noto Sans Arabic', 'Noto Sans Hebrew', 'Noto Sans SC', 'Noto Sans Devanagari', 'Noto Sans Bengali', sans-serif; }
      .sc-body { font-family: 'Inter', 'Noto Sans', 'Noto Sans Arabic', 'Noto Sans Hebrew', 'Noto Sans SC', 'Noto Sans Devanagari', 'Noto Sans Bengali', sans-serif; }
      .sc-mono { font-family: 'JetBrains Mono', 'Noto Sans', 'Noto Sans Arabic', 'Noto Sans Hebrew', 'Noto Sans SC', 'Noto Sans Devanagari', 'Noto Sans Bengali', monospace; }
      .sc-tape {
        background: repeating-linear-gradient(45deg, #1B1E29 0, #1B1E29 14px, #191C26 14px, #191C26 28px);
      }
      @keyframes sc-scan { 0% { transform: translateY(-10px);} 50% { transform: translateY(120px);} 100% { transform: translateY(-10px);} }
      @keyframes sc-fadein { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
      @keyframes sc-stamp { 0% { opacity: 0; transform: scale(2.4) rotate(0deg);} 60% { opacity: 1; } 100% { opacity: 1; transform: scale(1) rotate(var(--stamp-rot));} }
      .sc-fadein { animation: sc-fadein 0.45s ease both; }
      @media (prefers-reduced-motion: reduce) {
        .sc-fadein, .sc-stamp-el { animation: none !important; }
      }
    `}</style>
  );
}

function LanguagePicker({ lang, setLang, dark }) {
  const [open, setOpen] = useState(false);
  const color = dark ? PAPER : INK;
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Language"
        style={{ background: "none", border: `1px solid ${dark ? "#3A3F4E" : "#C9C6BC"}`, borderRadius: 4, padding: "6px 8px", color, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
      >
        <Globe size={14} />
        <span className="sc-mono" style={{ fontSize: 11 }}>{translations[lang].native}</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            insetInlineEnd: 0,
            background: dark ? "#1B1E29" : "#fff",
            border: `1px solid ${dark ? "#3A3F4E" : "#C9C6BC"}`,
            borderRadius: 6,
            padding: 6,
            zIndex: 20,
            maxHeight: 260,
            overflowY: "auto",
            minWidth: 140,
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          }}
        >
          {LANGUAGE_ORDER.map((code) => (
            <button
              key={code}
              onClick={() => {
                setLang(code);
                setOpen(false);
              }}
              className="sc-body"
              style={{
                display: "block",
                width: "100%",
                textAlign: "start",
                background: code === lang ? (dark ? "#2A2F3E" : "#F0EFEA") : "none",
                border: "none",
                borderRadius: 4,
                padding: "8px 10px",
                color,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {translations[code].native}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Splash({ onStart, t, lang, setLang }) {
  return (
    <div className="sc-tape" style={{ height: "100%", display: "flex", flexDirection: "column", color: PAPER }}>
      <FontStyles />
      <div style={{ flexShrink: 0, padding: "28px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="sc-mono" style={{ fontSize: 12, letterSpacing: 2, color: SLATE }}>
          SCAMCHECK · {t.caseIntake}
        </div>
        <LanguagePicker lang={lang} setLang={setLang} dark />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 28px" }}>
        <div className="sc-fadein" style={{ maxWidth: 340 }}>
          <div
            className="sc-mono"
            style={{ display: "inline-block", fontSize: 11, letterSpacing: 2, color: ALARM, border: `1px solid ${ALARM}`, padding: "4px 10px", marginBottom: 18 }}
          >
            {t.eyebrow}
          </div>
          <h1 className="sc-display" style={{ fontSize: 40, lineHeight: 1.1, fontWeight: 700, margin: 0 }}>
            {t.headline1}
            <br />
            {t.headline2}
          </h1>
          <p className="sc-body" style={{ fontSize: 15, color: "#C9C6BC", marginTop: 16, lineHeight: 1.5 }}>
            {t.tagline}
          </p>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: "0 28px 28px" }}>
        <button
          onClick={onStart}
          className="sc-display"
          style={{
            width: "100%",
            background: ALARM,
            color: INK,
            border: "none",
            borderRadius: 4,
            padding: "16px 20px",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          {t.cta} <ArrowRight size={18} style={{ transform: document.dir === "rtl" ? "scaleX(-1)" : "none" }} />
        </button>
      </div>
    </div>
  );
}

const TRACKING_DOMAINS = ["googleadservices.com", "doubleclick.net", "googlesyndication.com", "google.com/aclk", "bat.bing.com"];

function linkWarning(link, t) {
  const trimmed = link.trim();
  if (!trimmed) return null;
  if (trimmed.length > 300) return t.trackingWarnLong;
  const lower = trimmed.toLowerCase();
  if (TRACKING_DOMAINS.some((d) => lower.includes(d))) return t.trackingWarnDomain;
  return null;
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="sc-mono" style={{ fontSize: 11, letterSpacing: 1.5, color: SLATE, marginBottom: 6, textTransform: "uppercase" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "#fff",
  border: `1.5px solid ${INK}`,
  borderRadius: 3,
  padding: "12px 12px",
  fontSize: 15,
  fontFamily: "'Inter', sans-serif",
  color: INK,
  outline: "none",
};

function InputScreen({ onBack, onSubmit, prefill, t, lang, setLang }) {
  const [where, setWhere] = useState(prefill?.where || WHERE_OPTIONS[0]);
  const [description, setDescription] = useState(prefill?.description || "");
  const [link, setLink] = useState(prefill?.link || "");

  const warning = linkWarning(link, t);
  const canSubmit = (description.trim().length > 2 || link.trim().length > 5) && !(warning && description.trim().length <= 2);

  const BackIcon = document.dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <div style={{ height: "100%", background: PAPER, color: INK, display: "flex", flexDirection: "column" }}>
      <FontStyles />
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 20px 12px", borderBottom: `1.5px dashed ${INK}55` }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: INK, padding: 4 }} aria-label="Back">
          <BackIcon size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="sc-mono" style={{ fontSize: 11, color: SLATE, letterSpacing: 1.5 }}>{t.newCaseFile}</div>
          <div className="sc-display" style={{ fontSize: 18, fontWeight: 700 }}>{t.describeAd}</div>
        </div>
        <LanguagePicker lang={lang} setLang={setLang} />
      </div>

      <div style={{ padding: "20px", overflowY: "auto", flex: 1, minHeight: 0 }}>
        <Field label={t.whereLabel}>
          <select value={where} onChange={(e) => setWhere(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {WHERE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
            <option value="Somewhere else">{t.somewhereElse}</option>
          </select>
        </Field>

        <Field label={t.descLabel}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.descPlaceholder}
            rows={4}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "'Inter', sans-serif" }}
          />
        </Field>

        <Field label={t.linkLabel}>
          <div style={{ position: "relative" }}>
            <Link2 size={16} style={{ position: "absolute", insetInlineStart: 12, top: 14, color: SLATE }} />
            <input
              value={link}
              onChange={(e) => setLink(e.target.value.slice(0, 500))}
              placeholder="https://…"
              maxLength={500}
              style={{ ...inputStyle, paddingInlineStart: 34, borderColor: warning ? CAUTION : INK }}
            />
          </div>
          {warning && (
            <div className="sc-body" style={{ fontSize: 12, color: "#8A5A00", background: "#FFF3D6", border: `1px solid ${CAUTION}`, borderRadius: 3, padding: "8px 10px", marginTop: 6, lineHeight: 1.4 }}>
              {warning}
            </div>
          )}
        </Field>
      </div>

      <div style={{ padding: 20 }}>
        <button
          disabled={!canSubmit}
          onClick={() => onSubmit({ where, description, link })}
          className="sc-display"
          style={{
            width: "100%",
            background: canSubmit ? INK : "#C9C6BC",
            color: PAPER,
            border: "none",
            borderRadius: 4,
            padding: "15px 20px",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {t.submitBtn} <Search size={16} />
        </button>
      </div>
    </div>
  );
}

function LoadingScreen({ t }) {
  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => {
    const t1 = setInterval(() => setLineIdx((i) => (i + 1) % t.loadingLines.length), 1400);
    return () => clearInterval(t1);
  }, [t]);

  return (
    <div className="sc-tape" style={{ height: "100%", color: PAPER, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
      <FontStyles />
      <div style={{ width: 84, height: 84, borderRadius: "50%", border: `2px solid ${ALARM}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 26, position: "relative", overflow: "hidden" }}>
        <FileSearch size={34} color={ALARM} style={{ animation: "sc-scan 1.8s ease-in-out infinite" }} />
      </div>
      <div className="sc-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t.loadingTitle}</div>
      <div className="sc-mono" style={{ fontSize: 13, color: SLATE, minHeight: 20 }}>{t.loadingLines[lineIdx]}</div>
      <div className="sc-mono" style={{ fontSize: 11, color: "#5A5F6E", marginTop: 18 }}>{t.loadingNote}</div>
    </div>
  );
}

function ErrorScreen({ message, onRetry, onBack, t }) {
  return (
    <div style={{ height: "100%", background: PAPER, color: INK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center" }}>
      <FontStyles />
      <ShieldQuestion size={40} color={ALARM} style={{ marginBottom: 16 }} />
      <div className="sc-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t.errorTitle}</div>
      <div className="sc-body" style={{ fontSize: 14, color: "#4A4E5A", marginBottom: 22, lineHeight: 1.5 }}>{message}</div>
      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        <button onClick={onBack} className="sc-display" style={{ flex: 1, background: "transparent", color: INK, border: `1.5px solid ${INK}`, borderRadius: 4, padding: "12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {t.errorEdit}
        </button>
        <button onClick={onRetry} className="sc-display" style={{ flex: 1, background: INK, color: PAPER, border: "none", borderRadius: 4, padding: "12px", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
          <RotateCcw size={14} /> {t.errorRetry}
        </button>
      </div>
    </div>
  );
}

function ReviewRow({ item, positive, t }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "12px 0", borderBottom: `1px solid ${INK}22` }}>
      {positive ? <ThumbsUp size={16} color={VERIFIED} style={{ flexShrink: 0, marginTop: 2 }} /> : <ThumbsDown size={16} color={ALARM} style={{ flexShrink: 0, marginTop: 2 }} />}
      <div>
        <div className="sc-body" style={{ fontSize: 14, lineHeight: 1.4, color: INK }}>{item.text}</div>
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="sc-mono"
            style={{ fontSize: 11, color: positive ? VERIFIED : ALARM, marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "underline", textUnderlineOffset: 2 }}
          >
            {t.source}: {item.src} <ExternalLink size={11} />
          </a>
        ) : (
          <div className="sc-mono" style={{ fontSize: 11, color: SLATE, marginTop: 4 }}>{t.source}: {item.src}</div>
        )}
      </div>
    </div>
  );
}

function ResultsScreen({ query, result, caseId, fromCache, onNewCase, t }) {
  const VERDICT_META = {
    trust: { label: t.verdictTrust, color: VERIFIED, Icon: ShieldCheck, rotate: "-6deg" },
    caution: { label: t.verdictCaution, color: CAUTION, Icon: ShieldQuestion, rotate: "4deg" },
    avoid: { label: t.verdictAvoid, color: ALARM, Icon: ShieldAlert, rotate: "-4deg" },
    unknown: { label: t.verdictUnknown, color: SLATE, Icon: ShieldQuestion, rotate: "2deg" },
  };
  const meta = VERDICT_META[result.verdict] || VERDICT_META.unknown;
  const total = (result.positives?.length || 0) + (result.negatives?.length || 0);
  const posPct = total > 0 ? Math.round((result.positives.length / total) * 100) : 50;

  return (
    <div style={{ height: "100%", background: PAPER, color: INK, display: "flex", flexDirection: "column" }}>
      <FontStyles />
      <div style={{ padding: "18px 20px 0", borderBottom: `1.5px dashed ${INK}55`, paddingBottom: 14 }}>
        <div className="sc-mono" style={{ fontSize: 11, color: SLATE, letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>#{caseId} · {query.where.toUpperCase()}</span>
          {fromCache && (
            <span style={{ color: VERIFIED, border: `1px solid ${VERIFIED}`, borderRadius: 3, padding: "1px 6px", fontSize: 10 }}>
              {t.alreadyInvestigated}
            </span>
          )}
        </div>
        <div className="sc-display" style={{ fontSize: 17, fontWeight: 700, marginTop: 4, lineHeight: 1.3, wordBreak: "break-word", overflowWrap: "anywhere" }}>
          {query.description?.trim() || query.link}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 20px" }}>
        <div
          className="sc-stamp-el"
          style={{ "--stamp-rot": meta.rotate, animation: "sc-stamp 0.5s ease-out both", transform: `rotate(${meta.rotate})`, display: "inline-flex", alignItems: "center", gap: 8, border: `3px solid ${meta.color}`, color: meta.color, borderRadius: 6, padding: "8px 14px", marginBottom: 12 }}
        >
          <meta.Icon size={20} />
          <span className="sc-display" style={{ fontWeight: 700, fontSize: 15, letterSpacing: 0.5 }}>{meta.label}</span>
        </div>

        {result.summary && (
          <div className="sc-body" style={{ fontSize: 14, color: "#4A4E5A", marginBottom: 18, lineHeight: 1.5 }}>{result.summary}</div>
        )}

        {total > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div className="sc-mono" style={{ fontSize: 11, color: SLATE, letterSpacing: 1, marginBottom: 6 }}>
              {result.positives.length} {t.positive} · {result.negatives.length} {t.negative}
            </div>
            <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex", background: "#ddd" }}>
              <div style={{ width: `${posPct}%`, background: VERIFIED }} />
              <div style={{ width: `${100 - posPct}%`, background: ALARM }} />
            </div>
          </div>
        )}

        {result.positives?.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div className="sc-display" style={{ fontSize: 13, fontWeight: 700, color: VERIFIED, marginBottom: 2 }}>{t.whatChecksOut}</div>
            {result.positives.map((p, i) => <ReviewRow key={i} item={p} positive t={t} />)}
          </div>
        )}

        {result.negatives?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="sc-display" style={{ fontSize: 13, fontWeight: 700, color: ALARM, marginBottom: 2 }}>{t.whatDoesnt}</div>
            {result.negatives.map((n, i) => <ReviewRow key={i} item={n} positive={false} t={t} />)}
          </div>
        )}

        <div className="sc-mono" style={{ fontSize: 10, color: "#9A9689", marginTop: 20, lineHeight: 1.5 }}>
          {t.disclaimer}
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <button
          onClick={onNewCase}
          className="sc-display"
          style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 4, padding: "14px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          {t.checkAnother}
        </button>
      </div>
    </div>
  );
}

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeSlug(q) {
  const raw = (q.link?.trim() || q.description?.trim() || "").toLowerCase();
  return raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150) || "unknown";
}

const FILLER_PHRASES = [
  "losing weight with", "lose weight with", "help you lose weight", "helps you lose weight",
  "weight loss with", "trying to", "try this", "get this", "buy this", "this is", "that is",
  "the ad for", "an ad for", "advertisement for", "ad for",
];

const STOPWORDS = new Set([
  "a", "an", "the", "with", "for", "of", "and", "in", "on", "is", "are", "was", "were",
  "to", "from", "using", "use", "uses", "try", "trying", "get", "getting", "buy", "buying",
  "this", "that", "it", "its", "ad", "ads",
]);

function significantWords(q) {
  let text = (q.description?.trim() || "").toLowerCase();
  if (!text) return [];
  for (const phrase of FILLER_PHRASES) {
    text = text.split(phrase).join(" ");
  }
  const words = text.replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w && !STOPWORDS.has(w));
  return [...new Set(words)];
}

// Looks across every cached ad IN THE SAME LANGUAGE for a fuzzy word-overlap
// match, same logic as before — just querying Supabase instead of localStorage,
// which is what makes this shared across every user of the app.
async function findExistingSlug(curWords, lang) {
  if (!curWords.length) return null;
  try {
    const { data, error } = await supabase.from("cached_ads").select("slug").eq("lang", lang);
    if (error || !data?.length) return null;
    const setA = new Set(curWords);
    let best = null;
    let bestScore = 0;
    for (const row of data) {
      const kw = row.slug.split("-").filter(Boolean);
      if (!kw.length) continue;
      const setB = new Set(kw);
      let intersection = 0;
      for (const w of setA) if (setB.has(w)) intersection++;
      const overlap = intersection / Math.min(setA.size, setB.size);
      if (overlap > bestScore) {
        bestScore = overlap;
        best = row.slug;
      }
    }
    return bestScore >= 0.5 ? best : null;
  } catch (e) {
    return null;
  }
}

async function getCachedResult(slug, lang) {
  try {
    const { data, error } = await supabase.from("cached_ads").select("*").eq("slug", slug).eq("lang", lang).maybeSingle();
    if (error || !data) return null;
    return { result: data.result_json, caseId: data.case_id };
  } catch (e) {
    return null;
  }
}

async function saveCachedResult(slug, lang, result, caseId) {
  try {
    await supabase.from("cached_ads").upsert({ slug, lang, result_json: result, case_id: caseId }, { onConflict: "slug,lang" });
  } catch (e) {
    // caching is a nice-to-have — don't block the user if it fails
  }
}

async function logSearchEvent(slug) {
  try {
    await supabase.from("search_events").insert({ slug });
  } catch (e) {
    // non-critical — powers the future leaderboard, shouldn't block a search
  }
}

export default function ScamCheckApp() {
  const [lang, setLangState] = useState(getInitialLang);
  const [screen, setScreen] = useState("splash");
  const [query, setQuery] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [caseId, setCaseId] = useState("0000");
  const [fromCache, setFromCache] = useState(false);

  const t = translations[lang];
  const isRtl = !!t.rtl;

  useEffect(() => {
    document.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  const setLang = (code) => {
    setLangState(code);
    try {
      window.localStorage.setItem("sc-lang", code);
    } catch (e) {
      // ignore
    }
  };

  const runInvestigation = async (q) => {
    setQuery(q);
    setFromCache(false);

    const curWords = significantWords(q);
    let slug = null;

    try {
      if (curWords.length) {
        const matchedSlug = await findExistingSlug(curWords, lang);
        if (matchedSlug) {
          const cached = await getCachedResult(matchedSlug, lang);
          if (cached) {
            setResult(cached.result);
            setCaseId(cached.caseId);
            setFromCache(true);
            setScreen("results");
            logSearchEvent(matchedSlug);
            return;
          }
        }
      } else {
        const linkSlug = normalizeSlug(q);
        const cached = await getCachedResult(linkSlug, lang);
        if (cached) {
          setResult(cached.result);
          setCaseId(cached.caseId);
          setFromCache(true);
          setScreen("results");
          logSearchEvent(linkSlug);
          return;
        }
      }
    } catch (e) {
      // no cached entry — fall through to a live search
    }

    slug = curWords.length ? [...curWords].sort().join("-").slice(0, 100) : normalizeSlug(q);

    setScreen("loading");
    const newCaseId = String(1000 + Math.floor(Math.random() * 8999));
    setCaseId(newCaseId);

    try {
      const userMessage = [
        `Ad seen on: ${q.where}`,
        q.description?.trim() ? `Description: ${q.description.trim()}` : null,
        q.link?.trim() ? `Link: ${q.link.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_tokens: 1800,
          system: buildSystemPrompt(t, t.name),
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      if (!response.ok) throw new Error(`Request failed (${response.status})`);

      const data = await response.json();
      const textBlocks = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      if (!textBlocks) throw new Error("No response text returned");

      const parsed = extractJson(textBlocks);
      setResult(parsed);
      setScreen("results");

      saveCachedResult(slug, lang, parsed, newCaseId);
      logSearchEvent(slug);
    } catch (err) {
      setErrorMsg(
        err.message === "No JSON found in response" || err.message.includes("JSON") ? t.errorJsonFailed : t.errorReqFailed
      );
      setScreen("error");
    }
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        width: "100%",
        maxWidth: 400,
        height: "min(720px, calc(100dvh - 16px))",
        margin: "0 auto",
        background: INK,
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        border: "6px solid #222633",
      }}
    >
      {screen === "splash" && <Splash onStart={() => setScreen("input")} t={t} lang={lang} setLang={setLang} />}
      {screen === "input" && (
        <InputScreen onBack={() => setScreen("splash")} onSubmit={runInvestigation} prefill={query} t={t} lang={lang} setLang={setLang} />
      )}
      {screen === "loading" && <LoadingScreen t={t} />}
      {screen === "error" && (
        <ErrorScreen message={errorMsg} onRetry={() => runInvestigation(query)} onBack={() => setScreen("input")} t={t} />
      )}
      {screen === "results" && result && (
        <ResultsScreen query={query} result={result} caseId={caseId} fromCache={fromCache} onNewCase={() => setScreen("input")} t={t} />
      )}
    </div>
  );
}
