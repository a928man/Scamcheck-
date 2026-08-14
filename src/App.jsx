import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

const INK = "#12141C";
const PAPER = "#EDEAE0";
const ALARM = "#FF4F4F";
const CAUTION = "#FFB020";
const VERIFIED = "#35C488";
const SLATE = "#8A8F9E";

const LOADING_LINES = [
  "Pulling up the receipts…",
  "Cross-referencing reviews…",
  "Checking who actually got the product…",
  "Weighing the evidence…",
  "Drafting the verdict…",
];

const WHERE_OPTIONS = ["YouTube", "Instagram", "TikTok", "TV", "Facebook", "Somewhere else"];

const VERDICT_META = {
  trust: { label: "LIKELY LEGIT", color: VERIFIED, Icon: ShieldCheck, rotate: "-6deg" },
  caution: { label: "PROCEED WITH CAUTION", color: CAUTION, Icon: ShieldQuestion, rotate: "4deg" },
  avoid: { label: "LIKELY A SCAM", color: ALARM, Icon: ShieldAlert, rotate: "-4deg" },
  unknown: { label: "NOT ENOUGH TO GO ON", color: SLATE, Icon: ShieldQuestion, rotate: "2deg" },
};

const SYSTEM_PROMPT = `You are ScamCheck, a research assistant that investigates advertisements for a consumer safety app.

You will be given a description of an ad someone saw, where they saw it, and optionally a link. Either a description or a link will always be present — if only a link is given, treat the link itself as the subject and research the company/product it points to.

Search the web for independent reviews, complaints, refund/chargeback reports, fact-checks of specific claims, and any scam or fraud reports connected to this product or company. Also look for genuine positive evidence (independent testing, verified buyer reports, reputable coverage).

Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "verdict": "trust" | "caution" | "avoid" | "unknown",
  "summary": "one plain sentence explaining the verdict",
  "positives": [{"text": "specific finding, one sentence", "src": "publication or site name", "url": "https://..."}],
  "negatives": [{"text": "specific finding, one sentence", "src": "publication or site name", "url": "https://..."}]
}

Rules:
- Use "unknown" only if you genuinely cannot find enough information after searching — do not invent findings to fill space.
- positives: 0 to 4 items. negatives: 0 to 5 items. Every item must reflect something you actually found, not ad copy or assumptions.
- "src" should be a real, specific outlet or source name (e.g. "Better Business Bureau", "Reddit r/scams", "Wirecutter"), not a generic label.
- "url" must be the real, exact URL of the page you found that finding on. Never invent or guess a URL — if you don't have the real URL for a finding, omit that finding entirely rather than including a fake or best-guess link.
- Base the verdict on the weight of real evidence, not on how the ad sounds.
- Keep each "text" under 25 words.`;

function FontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
      .sc-display { font-family: 'Space Grotesk', sans-serif; }
      .sc-body { font-family: 'Inter', sans-serif; }
      .sc-mono { font-family: 'JetBrains Mono', monospace; }
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

function Splash({ onStart }) {
  return (
    <div
      className="sc-tape"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        color: PAPER,
      }}
    >
      <FontStyles />
      <div style={{ flexShrink: 0, padding: "28px 28px 0" }}>
        <div className="sc-mono" style={{ fontSize: 12, letterSpacing: 2, color: SLATE }}>
          SCAMCHECK · CASE INTAKE
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 28px" }}>
        <div className="sc-fadein" style={{ maxWidth: 340 }}>
          <div
            className="sc-mono"
            style={{
              display: "inline-block",
              fontSize: 11,
              letterSpacing: 2,
              color: ALARM,
              border: `1px solid ${ALARM}`,
              padding: "4px 10px",
              marginBottom: 18,
            }}
          >
            BEFORE YOU BUY
          </div>
          <h1 className="sc-display" style={{ fontSize: 44, lineHeight: 1.05, fontWeight: 700, margin: 0 }}>
            Don't get
            <br />
            played.
          </h1>
          <p className="sc-body" style={{ fontSize: 15, color: "#C9C6BC", marginTop: 16, lineHeight: 1.5 }}>
            Saw an ad that seemed a little too good? Describe it. We'll pull the reviews,
            the complaints, and the receipts — then give it to you straight.
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
          OPEN A CASE FILE <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

const TRACKING_DOMAINS = ["googleadservices.com", "doubleclick.net", "googlesyndication.com", "google.com/aclk", "bat.bing.com"];

function linkWarning(link) {
  const trimmed = link.trim();
  if (!trimmed) return null;
  if (trimmed.length > 300) {
    return "That link looks like an ad-tracking redirect, not the actual page. Try the product's real website URL instead, or just describe the ad below.";
  }
  const lower = trimmed.toLowerCase();
  if (TRACKING_DOMAINS.some((d) => lower.includes(d))) {
    return "That's an ad-network tracking link, not the destination page. Open it, then paste the URL it lands on — or just describe the ad below.";
  }
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

function InputScreen({ onBack, onSubmit, prefill }) {
  const [where, setWhere] = useState(prefill?.where || WHERE_OPTIONS[0]);
  const [description, setDescription] = useState(prefill?.description || "");
  const [link, setLink] = useState(prefill?.link || "");

  const canSubmit =
    (description.trim().length > 2 || link.trim().length > 5) &&
    !(linkWarning(link) && description.trim().length <= 2);

  const warning = linkWarning(link);

  return (
    <div style={{ height: "100%", background: PAPER, color: INK, display: "flex", flexDirection: "column" }}>
      <FontStyles />
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 20px 12px", borderBottom: `1.5px dashed ${INK}55` }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: INK, padding: 4 }} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="sc-mono" style={{ fontSize: 11, color: SLATE, letterSpacing: 1.5 }}>NEW CASE FILE</div>
          <div className="sc-display" style={{ fontSize: 18, fontWeight: 700 }}>Describe the ad</div>
        </div>
      </div>

      <div style={{ padding: "20px", overflowY: "auto", flex: 1, minHeight: 0 }}>
        <Field label="Where did you see it?">
          <select value={where} onChange={(e) => setWhere(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {WHERE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </Field>

        <Field label="Company, product, or describe the ad">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. a supplement called 'FlexBoost' that claims to melt belly fat in a week"
            rows={4}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "'Inter', sans-serif" }}
          />
        </Field>

        <Field label="Link to the ad or product (optional if you described it above)">
          <div style={{ position: "relative" }}>
            <Link2 size={16} style={{ position: "absolute", left: 12, top: 14, color: SLATE }} />
            <input
              value={link}
              onChange={(e) => setLink(e.target.value.slice(0, 500))}
              placeholder="https://…"
              maxLength={500}
              style={{ ...inputStyle, paddingLeft: 34, borderColor: warning ? CAUTION : INK }}
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
          INVESTIGATE THIS AD <Search size={16} />
        </button>
      </div>
    </div>
  );
}

function LoadingScreen() {
  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => {
    const t1 = setInterval(() => setLineIdx((i) => (i + 1) % LOADING_LINES.length), 1400);
    return () => clearInterval(t1);
  }, []);

  return (
    <div className="sc-tape" style={{ height: "100%", color: PAPER, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
      <FontStyles />
      <div style={{ width: 84, height: 84, borderRadius: "50%", border: `2px solid ${ALARM}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 26, position: "relative", overflow: "hidden" }}>
        <FileSearch size={34} color={ALARM} style={{ animation: "sc-scan 1.8s ease-in-out infinite" }} />
      </div>
      <div className="sc-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Working the case…</div>
      <div className="sc-mono" style={{ fontSize: 13, color: SLATE, minHeight: 20 }}>{LOADING_LINES[lineIdx]}</div>
      <div className="sc-mono" style={{ fontSize: 11, color: "#5A5F6E", marginTop: 18 }}>Live web research — this can take up to a minute.</div>
    </div>
  );
}

function ErrorScreen({ message, onRetry, onBack }) {
  return (
    <div style={{ height: "100%", background: PAPER, color: INK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center" }}>
      <FontStyles />
      <ShieldQuestion size={40} color={ALARM} style={{ marginBottom: 16 }} />
      <div className="sc-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Case went cold</div>
      <div className="sc-body" style={{ fontSize: 14, color: "#4A4E5A", marginBottom: 22, lineHeight: 1.5 }}>{message}</div>
      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        <button onClick={onBack} className="sc-display" style={{ flex: 1, background: "transparent", color: INK, border: `1.5px solid ${INK}`, borderRadius: 4, padding: "12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          EDIT CASE
        </button>
        <button onClick={onRetry} className="sc-display" style={{ flex: 1, background: INK, color: PAPER, border: "none", borderRadius: 4, padding: "12px", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
          <RotateCcw size={14} /> RETRY
        </button>
      </div>
    </div>
  );
}

function ReviewRow({ item, positive }) {
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
            SOURCE: {item.src} <ExternalLink size={11} />
          </a>
        ) : (
          <div className="sc-mono" style={{ fontSize: 11, color: SLATE, marginTop: 4 }}>SOURCE: {item.src}</div>
        )}
      </div>
    </div>
  );
}

function ResultsScreen({ query, result, caseId, fromCache, onNewCase }) {
  const meta = VERDICT_META[result.verdict] || VERDICT_META.unknown;
  const total = (result.positives?.length || 0) + (result.negatives?.length || 0);
  const posPct = total > 0 ? Math.round((result.positives.length / total) * 100) : 50;

  return (
    <div style={{ height: "100%", background: PAPER, color: INK, display: "flex", flexDirection: "column" }}>
      <FontStyles />
      <div style={{ padding: "18px 20px 0", borderBottom: `1.5px dashed ${INK}55`, paddingBottom: 14 }}>
        <div className="sc-mono" style={{ fontSize: 11, color: SLATE, letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>CASE #{caseId} · {query.where.toUpperCase()}</span>
          {fromCache && (
            <span style={{ color: VERIFIED, border: `1px solid ${VERIFIED}`, borderRadius: 3, padding: "1px 6px", fontSize: 10 }}>
              ALREADY INVESTIGATED
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
              {result.positives.length} POSITIVE · {result.negatives.length} NEGATIVE
            </div>
            <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex", background: "#ddd" }}>
              <div style={{ width: `${posPct}%`, background: VERIFIED }} />
              <div style={{ width: `${100 - posPct}%`, background: ALARM }} />
            </div>
          </div>
        )}

        {result.positives?.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div className="sc-display" style={{ fontSize: 13, fontWeight: 700, color: VERIFIED, marginBottom: 2 }}>WHAT CHECKS OUT</div>
            {result.positives.map((p, i) => <ReviewRow key={i} item={p} positive />)}
          </div>
        )}

        {result.negatives?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="sc-display" style={{ fontSize: 13, fontWeight: 700, color: ALARM, marginBottom: 2 }}>WHAT DOESN'T</div>
            {result.negatives.map((n, i) => <ReviewRow key={i} item={n} positive={false} />)}
          </div>
        )}

        <div className="sc-mono" style={{ fontSize: 10, color: "#9A9689", marginTop: 20, lineHeight: 1.5 }}>
          AI-GENERATED RESEARCH, NOT PROFESSIONAL ADVICE. VERIFY BEFORE MAKING A PURCHASE DECISION.
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <button
          onClick={onNewCase}
          className="sc-display"
          style={{ width: "100%", background: INK, color: PAPER, border: "none", borderRadius: 4, padding: "14px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          CHECK ANOTHER AD
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

function normalizeKey(q) {
  const raw = (q.link?.trim() || q.description?.trim() || "").toLowerCase();
  // storage keys can't contain whitespace, slashes, or quotes
  return "case:" + raw.replace(/[\s/\\'"]+/g, "_").slice(0, 150);
}

const FILLER_PHRASES = [
  "losing weight with",
  "lose weight with",
  "help you lose weight",
  "helps you lose weight",
  "weight loss with",
  "trying to",
  "try this",
  "get this",
  "buy this",
  "this is",
  "that is",
  "the ad for",
  "an ad for",
  "advertisement for",
  "ad for",
];

const STOPWORDS = new Set([
  "a", "an", "the", "with", "for", "of", "and", "in", "on", "is", "are", "was", "were",
  "to", "from", "using", "use", "uses", "try", "trying", "get", "getting", "buy", "buying",
  "this", "that", "it", "its", "ad", "ads",
]);

// Lightweight storage wrapper backed by the browser's localStorage.
// Note: this is per-device only (not shared across users like the chat
// preview's window.storage was). Swapping this for a real shared database
// is the natural next upgrade once the app has real users.
const storage = {
  async get(key) {
    try {
      const v = window.localStorage.getItem(key);
      return v ? { value: v } : null;
    } catch (e) {
      return null;
    }
  },
  async set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return { key, value };
    } catch (e) {
      return null;
    }
  },
  async list(prefix) {
    try {
      const keys = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(prefix)) keys.push(k);
      }
      return { keys };
    } catch (e) {
      return { keys: [] };
    }
  },
};

function significantWords(q) {
  let text = (q.description?.trim() || "").toLowerCase();
  if (!text) return [];
  for (const phrase of FILLER_PHRASES) {
    text = text.split(phrase).join(" ");
  }
  const words = text
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w));
  return [...new Set(words)];
}

async function findExistingMatch(curWords) {
  if (!curWords.length) return null;
  try {
    const listRes = await storage.list("case:slug:");
    if (!listRes?.keys?.length) return null;
    const setA = new Set(curWords);
    let best = null;
    let bestScore = 0;
    for (const k of listRes.keys) {
      const kw = k.slice("case:slug:".length).split("-").filter(Boolean);
      if (!kw.length) continue;
      const setB = new Set(kw);
      let intersection = 0;
      for (const w of setA) if (setB.has(w)) intersection++;
      // overlap coefficient: how much of the SMALLER set is shared — handles
      // short queries ("Riseguide") matching longer ones ("Riseguide articulation practice")
      const overlap = intersection / Math.min(setA.size, setB.size);
      if (overlap > bestScore) {
        bestScore = overlap;
        best = k;
      }
    }
    return bestScore >= 0.5 ? best : null;
  } catch (e) {
    return null;
  }
}

export default function ScamCheckApp() {
  const [screen, setScreen] = useState("splash");
  const [query, setQuery] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [caseId, setCaseId] = useState("0000");
  const [fromCache, setFromCache] = useState(false);

  const runInvestigation = async (q) => {
    setQuery(q);
    setFromCache(false);

    const curWords = significantWords(q);
    let key = null;

    // Check if someone already investigated this same ad, even worded differently
    try {
      if (curWords.length) {
        const matchedKey = await findExistingMatch(curWords);
        if (matchedKey) {
          const cached = await storage.get(matchedKey);
          if (cached?.value) {
            const parsedCached = JSON.parse(cached.value);
            setResult(parsedCached.result);
            setCaseId(parsedCached.caseId);
            setFromCache(true);
            setScreen("results");
            return;
          }
        }
      } else {
        // link-only submission — fall back to exact link matching
        const linkKey = normalizeKey(q);
        const cached = await storage.get(linkKey);
        if (cached?.value) {
          const parsedCached = JSON.parse(cached.value);
          setResult(parsedCached.result);
          setCaseId(parsedCached.caseId);
          setFromCache(true);
          setScreen("results");
          return;
        }
      }
    } catch (e) {
      // no cached entry — fall through to a live search
    }

    key = curWords.length ? "case:slug:" + [...curWords].sort().join("-").slice(0, 100) : normalizeKey(q);

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
          system: SYSTEM_PROMPT,
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

      // Save for the next person who checks this same ad
      try {
        await storage.set(key, JSON.stringify({ result: parsed, caseId: newCaseId }));
      } catch (e) {
        // caching is a nice-to-have — don't block the user if it fails
      }
    } catch (err) {
      setErrorMsg(
        err.message === "No JSON found in response" || err.message.includes("JSON")
          ? "We got a response back but couldn't make sense of it. Try again."
          : "Couldn't complete the research right now. Try again in a moment."
      );
      setScreen("error");
    }
  };

  return (
    <div
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
      {screen === "splash" && <Splash onStart={() => setScreen("input")} />}
      {screen === "input" && (
        <InputScreen onBack={() => setScreen("splash")} onSubmit={runInvestigation} prefill={query} />
      )}
      {screen === "loading" && <LoadingScreen />}
      {screen === "error" && (
        <ErrorScreen
          message={errorMsg}
          onRetry={() => runInvestigation(query)}
          onBack={() => setScreen("input")}
        />
      )}
      {screen === "results" && result && (
        <ResultsScreen query={query} result={result} caseId={caseId} fromCache={fromCache} onNewCase={() => setScreen("input")} />
      )}
    </div>
  );
}
