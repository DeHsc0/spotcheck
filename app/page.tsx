"use client";

import { useRef, useState } from "react";

import {
  Activity,
  ArrowDown,
  ArrowUpRight,
  ChevronDown,
  FileAudio,
  Info,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

const sampleAudio =
  "https://res.cloudinary.com/dknwd3sez/video/upload/v1787682527/user-uploads/lsozwewwk7fn2fiont8l.mp3";

const analysis = {
  callSummary:
    "The customer called to cancel her Essence of Argan subscription after receiving a trial sample, citing affordability concerns about the $83.80 monthly charge. The scheduler attempted retention by extending the trial and offering progressively larger discounts, ultimately securing her agreement to continue at $16.76 per month.",
  categories: [
    [
      "Greeting",
      5,
      "“You have reached the Essence of Argan. This is Donna.”",
      "Prompt, professional, included the company name and scheduler name, and set a positive tone.",
    ],
    [
      "Active Listening",
      4,
      "“I do understand that…” and “what I heard from you is that…”",
      "Acknowledged and paraphrased the customer, but mispronounced her name and could have shown more empathy.",
    ],
    [
      "Information Gathering",
      5,
      "Collected full name, email, shipping address, billing address, phone number, and reason for cancellation.",
      "Systematically gathered and verified the details needed to address the request.",
    ],
    [
      "Objection Handling & Problem Solving",
      5,
      "Extended the trial by 15 days, then offered 20%, 40%, and eventually 80% off, reducing the monthly price to $16.76.",
      "Persistently addressed the price objection and converted a cancellation into retention.",
    ],
    [
      "Closing",
      4,
      "“So just for a recap… you will be only paying $16.76.”",
      "Summarized next steps and ended warmly, but mispronounced the company name at the end.",
    ],
    [
      "Communication Skills",
      3,
      "Repeated “um” and “uh”; “Blake” for “Lake”; “Oregon” for “Argan”; grammatical issues.",
      "Generally clear and confident, but name errors and fillers reduced professionalism and accuracy.",
    ],
  ],
  criticalError: "None identified",
  percentage: 85,
  total: 361,
  judgement:
    "The scheduler effectively saved the subscription through persistent, creative discounting, demonstrating strong objection handling and information gathering. However, avoidable communication errors could harm trust and professionalism. With better attention to names and clearer articulation, the customer experience would be significantly improved.",
};

function AudioPlayer({
  url,
  playing,
  setPlaying,
}: {
  url: string;
  playing: boolean;
  setPlaying: (v: boolean) => void;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const toggle = () => {
    if (!ref.current) return;
    if (playing) ref.current.pause();
    else ref.current.play().catch(() => {});
    setPlaying(!playing);
  };
  const seek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (ref.current) ref.current.currentTime = value;
    setProgress(value);
  };
  const format = (value: number) =>
    `${Math.floor(value / 60)
      .toString()
      .padStart(2, "0")}:${Math.floor(value % 60)
      .toString()
      .padStart(2, "0")}`;
  return (
    <div className="audio-player">
      <button
        className="play-button"
        onClick={toggle}
        aria-label={playing ? "Pause call" : "Play call"}
      >
        {playing ? (
          <Pause size={16} fill="currentColor" />
        ) : (
          <Play size={16} fill="currentColor" />
        )}
      </button>
      <div className="audio-track">
        <div className="waveform" aria-hidden="true">
          {Array.from({ length: 26 }, (_, i) => (
            <i key={i} style={{ height: `${22 + ((i * 17) % 52)}%` }} />
          ))}
        </div>
        <input
          className="audio-seek"
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={Math.min(progress, duration || 0)}
          onChange={seek}
          aria-label="Seek through call recording"
        />
      </div>
      <div className="audio-time">
        <strong>{playing ? "Playing call" : "Listen to call"}</strong>
        <small>
          {format(progress)} / {format(duration)}
        </small>
      </div>
      <audio
        ref={ref}
        src={url}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
      />
    </div>
  );
}

export default function Page() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const [results, setResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(analysis);
  const [open, setOpen] = useState<number | null>(0);
  const [question, setQuestion] = useState("");
  const [sent, setSent] = useState(false);
  const [additionalChecks, setAdditionalChecks] = useState("");
  const [sampleLoading, setSampleLoading] = useState(false);
  const choose = (f?: File) => {
    if (f?.type.startsWith("audio/")) {
      setFile(f);
      setUrl(URL.createObjectURL(f));
      setResults(false);
      setError("");
    }
  };
  const sample = async () => {
    setSampleLoading(true);
    setError("");

    try {
      const response = await fetch(sampleAudio);

      if (!response.ok) {
        throw new Error(`Sample audio failed to load (${response.status})`);
      }

      const blob = await response.blob();
      const sampleFile = new File([blob], "sample-scheduler-call.wav", {
        type: "audio/wav",
      });
      setFile(sampleFile);
      setUrl(URL.createObjectURL(blob));
      setResults(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the sample audio.",
      );
    } finally {
      setSampleLoading(false);
    }
  };
  const analyze = async () => {

    if (!file) return;
    
    setLoading(true);
    
    setError("");
    
    setPlaying(false);
    
    const formData = new FormData();
    
    formData.append("audio", file);
    formData.append("additional_checks", additionalChecks);
    
    try {
    
      const response = await fetch("/analysis", {
        method: "POST",
        body: formData,
      });
    
      if (!response.ok)
    
        throw new Error(`Analysis request failed (${response.status})`);

        const jsonData = await response.json()   
        
        const payload = JSON.parse(jsonData.ai)
    
        setAnalysisResult({
            callSummary: payload.callSummary,
            categories: (payload.categoryScores ?? []).map(
              (item: {
                category: string;
                score: number;
                evidence: string;
                justification: string;
              }) => [item.category, item.score, item.evidence, item.justification],
            ),
          criticalError: payload.criticalError,
          percentage: payload.overallScore?.weightedTotalScore?.percentage ?? 0,
          total: payload.overallScore?.weightedTotalScore?.totalScore ?? 0,
          judgement: payload.finalJudgement,
        });
      setResults(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to analyze this recording.",
      );
      setResults(false);
    } finally {
      setLoading(false);
    }
  };
  const reset = () => {
    setFile(null);
    setUrl("");
    setResults(false);
    setPlaying(false);
    setSampleLoading(false);
  };
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark">
            <Activity size={18} />
          </span>
          <strong>spotcheck</strong>
          <span className="beta">CONCEPT</span>
        </a>
        <nav className="page-nav">
          <a href="#quality">Call QA</a>
          <a href="#knowledge">Knowledge base</a>
        </nav>
        <span className="live-status">
          <span className="online-dot" /> Concept preview
        </span>
        <button className="icon-button" aria-label="About">
          <Info size={17} />
        </button>
      </header>
      <div id="top" className="workspace">
        <section className="hero-copy">
          <div className="kicker">
            <Sparkles size={14} /> A CONCEPT FOR MULTI-OFFICE CARE TEAMS
          </div>
          <h1>
            One clearer view
            <br />
            <em>of every call.</em>
          </h1>
          <p>
            Screen every scheduler conversation for quality, then give
            schedulers the office-specific answer they need while they are still
            with a patient.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#quality">
              Explore the concept <ArrowDown size={15} />
            </a>
            <span className="trust-note">
              <ShieldCheck size={15} /> Built for multi-office teams
            </span>
          </div>
        </section>
        <div className="intro-band">
          <span>THE IDEA</span>
          <p>
            Two distinct workflows in one concept: consistent quality screening
            after every call, and a policy-aware assistant during the call.
          </p>
        </div>
        <section id="quality" className="story-section">
          <div className="section-intro">
            <div>
              <span className="section-number">01</span>
              <span className="step-label">CALL QUALITY ASSURANCE</span>
              <h2>
                Screen every call.
                <br />
                <em>Know what happened.</em>
              </h2>
            </div>
            <p>
              SpotCheck turns each recording into a structured quality analysis
              of how the scheduler handled the conversation — not a generic
              coaching tool, but a consistent screening layer for every call.
            </p>
          </div>
          <div className="quality-grid">
            <section className="analyzer-card">
              <div className="card-header">
                <div>
                  <span className="step-label">CALL SCREENING</span>
                  <h3>Analyze a scheduler recording</h3>
                </div>
                <span className="format-pill">MP3 · WAV · OGG</span>
              </div>
              <div
                className={`dropzone ${file ? "has-file" : ""}`}
                onClick={() => input.current?.click()}
                role="button"
                tabIndex={0}
              >
                <input
                  ref={input}
                  hidden
                  type="file"
                  accept="audio/*"
                  onChange={(e) => choose(e.target.files?.[0])}
                />
                {file ? (
                  <>
                    <span className="upload-icon">
                      <FileAudio size={23} />
                    </span>
                    <strong>{file.name}</strong>
                    <small>
                      {file.size
                        ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                        : "Sample call"}{" "}
                      · Ready for screening
                    </small>
                    <button
                      className="remove-file"
                      onClick={(e) => {
                        e.stopPropagation();
                        reset();
                      }}
                      aria-label="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="upload-icon">
                      <Upload size={21} />
                    </span>
                    <strong>Drop a call recording here</strong>
                    <small>or click to browse your computer</small>
                  </>
                )}
              </div>
              {file && (
                <AudioPlayer
                  url={url}
                  playing={playing}
                  setPlaying={setPlaying}
                />
              )}
              <div className="sample-row">
                <span>See the full analysis flow</span>
                <button onClick={sample} disabled={sampleLoading || !!file}>
                  {sampleLoading ? (
                    <>
                      <Loader2 size={13} className="spin" /> Loading sample
                      audio…
                    </>
                  ) : (
                    <>
                      Use sample call <ArrowUpRight size={13} />
                    </>
                  )}
                </button>
              </div>
              <div className="additional-checks">
                <label className="step-label" htmlFor="additional-checks">
                  ADDITIONAL CHECKS
                </label>
                <textarea
                  id="additional-checks"
                  value={additionalChecks}
                  onChange={(e) => setAdditionalChecks(e.target.value)}
                  placeholder="Add any specific behaviors, policies, or risks to check..."
                  rows={3}
                  className="additional-checks-input"
                />
              </div>
              <button
                className="primary-button full"
                onClick={analyze}
                disabled={!file || loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="spin" /> Screening call… May take a min
                  </>
                ) : (
                  "Run quality analysis"
                )}
              </button>
              <p className="storage-note">
                Uploaded audio is currently stored securely in a CDN for this
                concept demo.
              </p>
            </section>
            <aside className="quality-explainer">
              <span className="step-label">WHAT IS SCREENED</span>
              <h3>A consistent read on every conversation.</h3>
              <p>
                Each call is checked against the same quality framework so
                leaders can spot patterns across offices, schedulers, and
                patient interactions.
              </p>
              <div className="check-list">
                <div className="flex items-center gap-1">
                  <ShieldCheck size={18} />
                  <span>Conversation behavior and accuracy</span>
                </div>
                <div className="flex items-center gap-1">
                  <Search size={18} />
                  <span>Evidence-backed category scores</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity size={18} />
                  <span>Critical errors and overall outcome</span>
                </div>
              </div>
            </aside>
          </div>
        </section>
        {error && (
          <p className="analysis-error" role="alert">
            {error}
          </p>
        )}
        {results && (
          <Results
            data={analysisResult}
            url={url}
            playing={playing}
            setPlaying={setPlaying}
            reset={reset}
            open={open}
            setOpen={setOpen}
          />
        )}
        <section id="knowledge" className="story-section knowledge-section">
          <div className="section-intro">
            <div>
              <span className="section-number lime">02</span>
              <span className="step-label">MULTI-OFFICE KNOWLEDGE BASE</span>
              <h2>
                The right answer,
                <br />
                <em>mid-conversation.</em>
              </h2>
            </div>
            <p>
              Schedulers handle different office mandates every day. This
              concept assistant retrieves the right local policy and makes it
              usable in the moment.
            </p>
          </div>
          <div className="knowledge-grid">
            <section className="knowledge-card">
              <div className="card-header">
                <div>
                  <span className="step-label">IN-CALL SUPPORT</span>
                  <h3>Ask the knowledge base</h3>
                </div>
                <span className="concept-pill">CONCEPT UI</span>
              </div>
              <div className="office-selector">
                <span className="online-dot" />
                <div>
                  <strong>Spot On Schedulers</strong>
                  <small>All offices · policy-aware answers</small>
                </div>
                <ChevronDown size={15} />
              </div>
              <div className="chat-window">
                <div className="message bot">
                  Hi Donna. I can help find the right office mandate, policy, or
                  scheduling detail while you are with a patient.
                </div>
                <div className="message user">
                  What is the cancellation policy for the Brooklyn office?
                </div>
                <div className="message bot answer">
                  <strong>Brooklyn office policy</strong>
                  <br />
                  Patients can cancel or reschedule up to 24 hours before their
                  appointment without a fee. Same-day changes may incur a $50
                  fee.<span>Source · Brooklyn office mandate</span>
                </div>
                {sent && (
                  <div className="message user">
                    {question || "What about Saturday appointments?"}
                  </div>
                )}
                <div className="chat-form">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.nativeEvent.isComposing &&
                        e.keyCode !== 229
                      ) {
                        setSent(true);
                        setQuestion("");
                      }
                    }}
                    placeholder="Ask about an office, policy, or mandate"
                    aria-label="Ask the knowledge base"
                  />
                  <button
                    onClick={() => {
                      if (question.trim()) {
                        setSent(true);
                        setQuestion("");
                      }
                    }}
                    aria-label="Send question"
                  >
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
            </section>
            <aside className="office-map">
              <div className="map-head">
                <span className="mini-label">OFFICE CONTEXT</span>
                <span className="concept-pill">3 MANDATES</span>
              </div>
              {[
                "Brooklyn · Cancellation & fees",
                "Queens · Insurance verification",
                "Manhattan · New patient intake",
              ].map((office, i) => (
                <div className="office-row" key={office}>
                  <span className={`office-dot ${i === 2 ? "muted" : ""}`} />
                  <div>
                    <strong>{office}</strong>
                    <small>
                      {i === 0 ? "Active context" : "Policy synced"}
                    </small>
                  </div>
                </div>
              ))}
              <p>
                Every answer stays grounded in the office selected by the
                scheduler, rather than relying on one universal policy.
              </p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function Results({
  data,
  url,
  playing,
  setPlaying,
  reset,
  open,
  setOpen,
}: {
  data: typeof analysis;
  url: string;
  playing: boolean;
  setPlaying: (v: boolean) => void;
  reset: () => void;
  open: number | null;
  setOpen: (v: number | null) => void;
}) {
  return (
    <section className="results-wrap">
      <div className="results-header">
        <div>
          <span className="kicker">ANALYSIS COMPLETE</span>
          <h2>Structured call screening</h2>
        </div>
        <button className="secondary-button" onClick={reset}>
          <RotateCcw size={15} /> Analyze another
        </button>
      </div>
      <AudioPlayer url={url} playing={playing} setPlaying={setPlaying} />
      <div className="result-grid">
        <section>
          <div className="summary-card">
            <span className="step-label">CALL SUMMARY</span>
            <p>{data.callSummary}</p>
            <div className="judgement">
              <span className="quote-mark">“</span>
              <div>
                <span className="mini-label">FINAL JUDGEMENT</span>
                <p>{data.judgement}</p>
              </div>
            </div>
          </div>
          <div className="section-heading scores-heading">
            <div>
              <span className="step-label">CATEGORY SCORES</span>
              <h3>How the scheduler handled the call</h3>
            </div>
          </div>
          <div className="score-list">
            {data.categories.map(([name, score, evidence, justification]) => (
              <div className="score-item" key={name}>
                <div className="score-row">
                  <span
                    className={`category-dot ${typeof score == "number" && score < 4 ? "warning" : ""}`}
                  />
                  <strong>{name}</strong>
                  <span className="bar">
                    <span style={{ width: `${Number(score) * 20}%` }} />
                  </span>
                  <span className="score-number">
                    {score}
                    <small>/ 5</small>
                  </span>
                </div>
                <div className="evidence">
                  <span className="evidence-time">EVIDENCE</span>
                  <div>
                    <p>{evidence}</p>
                    <div className="justification">
                      <span className="evidence-time">JUSTIFICATION</span>
                      <small>{justification}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <aside className="result-side">
          <div className="overall-card">
            <span className="mini-label">WEIGHTED TOTAL</span>
            <div
              className="score-ring"
              style={
                {
                  "--score": `${data.percentage * 3.6}deg`,
                } as React.CSSProperties
              }
            >
              <div>
                <strong>{data.percentage}</strong>
                <span>/ 100</span>
              </div>
            </div>
            <strong>Positive outcome</strong>
            <p>Overall score: {data.total} weighted points.</p>
          </div>
          <div className="critical-card">
            <span className="mini-label">CRITICAL ERROR</span>
            <h3>{data.criticalError}</h3>
            <p>No critical failure was identified in the analyzed recording.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
