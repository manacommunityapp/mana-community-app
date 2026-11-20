import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Radio, Square, Plus, Trash2, Mic, Camera,
  Users, ChevronRight, Eye, Settings,
  CheckCircle, Loader2,
} from "lucide-react";
import {
  sportsStreamingService,
  makeDefaultStream,
  type MatchStream,
} from "../../../services/sports/sportsStreamingService";

interface Props {
  matchId: number;
  matchTitle?: string;
}

type Panel = "overview" | "cameras" | "commentary";

export function SportsStreamControl({ matchId, matchTitle }: Props) {
  const [stream, setStream] = useState<MatchStream>(() => makeDefaultStream(matchId));
  const [panel, setPanel] = useState<Panel>("overview");
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  // Add-camera form
  const [camLabel, setCamLabel] = useState("");
  const [camUrl, setCamUrl] = useState("");
  const [camError, setCamError] = useState<string | null>(null);

  // Commentary form
  const [commentary, setCommentary] = useState("");

  // Stream title
  const [title, setTitle] = useState(stream.title);

  useEffect(() => {
    // Initial load
    sportsStreamingService.getStream(matchId).then((s) => { setStream(s); setTitle(s.title); }).catch(() => {});

    const id = setInterval(() => {
      sportsStreamingService.getStream(matchId).then(setStream).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [matchId]);

  async function goLive() {
    setStarting(true);
    try {
      setStream(await sportsStreamingService.startStream(matchId, title));
    } catch {}
    setStarting(false);
  }

  async function endStream() {
    setStopping(true);
    try {
      setStream(await sportsStreamingService.endStream(matchId));
    } catch {}
    setStopping(false);
  }

  async function addCamera() {
    if (!camLabel.trim()) { setCamError("Camera label required"); return; }
    if (!camUrl.trim())   { setCamError("Stream URL required"); return; }
    const url = camUrl.trim();
    const isYt = /youtube\.com|youtu\.be/.test(url);
    const isTwitch = /twitch\.tv/.test(url);
    const isHttp = /^https?:\/\//.test(url);
    if (!isYt && !isTwitch && !isHttp) {
      setCamError("Enter a YouTube, Twitch, or direct HTTPS URL");
      return;
    }
    setCamError(null);
    try {
      setStream(await sportsStreamingService.addCamera(matchId, camLabel.trim(), url));
      setCamLabel("");
      setCamUrl("");
    } catch (err: any) {
      setCamError(err?.message ?? "Failed to add camera");
    }
  }

  async function removeCamera(id: string) {
    try {
      setStream(await sportsStreamingService.removeCamera(matchId, id));
    } catch {}
  }

  async function postCommentary() {
    if (!commentary.trim()) return;
    const text = commentary.trim();
    setCommentary("");
    try {
      setStream(await sportsStreamingService.postMessage(matchId, text, "Commentator", true));
    } catch {}
  }

  function saveTitle() {
    // Title is saved on next goLive or re-link; no dedicated endpoint
    void title;
  }

  const isLive = stream.status === "LIVE";
  const isEnded = stream.status === "ENDED";

  const PANELS: { id: Panel; label: string; icon: typeof Camera }[] = [
    { id: "overview",    label: "Overview",    icon: Settings   },
    { id: "cameras",     label: "Cameras",     icon: Camera     },
    { id: "commentary",  label: "Commentary",  icon: Mic        },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 px-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500" />
            Stream Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{matchTitle || `Match #${matchId}`}</p>
        </div>
        {isLive && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-600 rounded-full text-white text-xs font-black animate-pulse">
            <Radio className="w-3 h-3" /> LIVE
          </div>
        )}
        {isEnded && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-500 rounded-full text-white text-xs font-black">
            Stream Ended
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Status" value={stream.status} accent={isLive ? "text-red-500" : "text-slate-400"} />
        <Stat label="Viewers" value={isLive ? String(stream.viewerCount || 1) : "—"} />
        <Stat label="Cameras" value={String(stream.cameras.length)} />
      </div>

      {/* Go live / End stream */}
      {!isEnded && (
        <div className="flex gap-3">
          {!isLive ? (
            <button
              type="button"
              onClick={goLive}
              disabled={starting || stream.cameras.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-sm cursor-pointer disabled:cursor-default transition"
            >
              {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
              {starting ? "Starting…" : "Go Live"}
            </button>
          ) : (
            <button
              type="button"
              onClick={endStream}
              disabled={stopping}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-700 hover:bg-slate-800 text-white font-black text-sm cursor-pointer disabled:opacity-50 transition"
            >
              {stopping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
              {stopping ? "Ending…" : "End Stream"}
            </button>
          )}
          {isLive && (
            <Link
              to={`/sports/match/${matchId}/stream`}
              target="_blank"
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-100 transition"
            >
              <Eye className="w-4 h-4" /> Preview
            </Link>
          )}
        </div>
      )}

      {stream.cameras.length === 0 && !isLive && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
          <Camera className="w-3.5 h-3.5 flex-shrink-0" />
          Add at least one camera feed before going live.
        </div>
      )}

      {/* Panel tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        {PANELS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPanel(p.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                panel === p.id
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{p.label}
            </button>
          );
        })}
      </div>

      {/* Panel: Overview */}
      {panel === "overview" && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">Stream Title</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Whitefield Warriors vs Sarjapur Strikers"
              />
              <button
                type="button"
                onClick={saveTitle}
                className="flex-shrink-0 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700 transition"
              >
                Save
              </button>
            </div>
          </div>

          {isLive && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">Recent Comments</p>
              {stream.chatMessages.length === 0 && (
                <p className="text-xs text-slate-400">No messages yet.</p>
              )}
              {stream.chatMessages.slice(-5).map((m) => (
                <div key={m.id} className="flex items-baseline gap-1.5 text-xs">
                  <span className="font-bold text-indigo-500 flex-shrink-0">{m.authorName}</span>
                  <span className="text-slate-600 dark:text-slate-300 truncate">{m.text}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-4 space-y-1.5">
            <p className="text-xs font-black text-green-700 dark:text-green-400">Share stream link</p>
            <p className="font-mono text-xs text-slate-600 dark:text-slate-400 break-all">
              {window.location.origin}/sports/match/{matchId}/stream
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/sports/match/${matchId}/stream`).catch(() => {});
              }}
              className="text-xs font-bold text-green-700 dark:text-green-400 hover:underline cursor-pointer"
            >
              Copy link
            </button>
          </div>
        </div>
      )}

      {/* Panel: Cameras */}
      {panel === "cameras" && (
        <div className="space-y-3">
          {stream.cameras.map((cam, i) => (
            <div
              key={cam.id}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                cam.id === stream.activeCameraId
                  ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Camera className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{cam.label}</p>
                <p className="text-[10px] text-slate-400 truncate">{cam.platform} · {cam.url}</p>
              </div>
              {cam.id === stream.activeCameraId && (
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded-md">Active</span>
              )}
              <button
                type="button"
                onClick={() => removeCamera(cam.id)}
                className="text-slate-400 hover:text-red-500 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400">Cam {i + 1}</span>
            </div>
          ))}

          {/* Add camera form */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Camera Feed
            </p>
            <input
              type="text"
              value={camLabel}
              onChange={(e) => setCamLabel(e.target.value)}
              placeholder="Label (e.g. Main Camera, Boundary Cam)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="url"
              value={camUrl}
              onChange={(e) => setCamUrl(e.target.value)}
              placeholder="YouTube / Twitch / HTTPS stream URL"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {camError && <p className="text-xs text-red-500">{camError}</p>}
            <div className="text-[10px] text-slate-400 space-y-0.5">
              <p>• YouTube: paste the watch URL (youtube.com/watch?v=…)</p>
              <p>• Twitch: paste your channel URL (twitch.tv/yourchannel)</p>
              <p>• Custom: any public HTTPS stream embed URL</p>
            </div>
            <button
              type="button"
              onClick={addCamera}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black transition cursor-pointer"
            >
              Add Camera
            </button>
          </div>
        </div>
      )}

      {/* Panel: Commentary */}
      {panel === "commentary" && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-indigo-500" /> Post Live Commentary
            </p>
            <textarea
              rows={3}
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              placeholder="e.g. SIX! Ravi Kumar hammers it over long-on for a maximum…"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              type="button"
              onClick={postCommentary}
              disabled={!commentary.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-black transition cursor-pointer disabled:cursor-default"
            >
              Post Commentary
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Commentary Log</p>
            {stream.chatMessages.filter((m) => m.isCommentary).length === 0 && (
              <p className="text-xs text-slate-400">No commentary posted yet.</p>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stream.chatMessages
                .filter((m) => m.isCommentary)
                .slice(-20)
                .reverse()
                .map((m) => (
                  <div key={m.id} className="flex items-start gap-2 text-xs">
                    <CheckCircle className="w-3 h-3 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-700 dark:text-slate-300 leading-snug">{m.text}</p>
                    <span className="text-slate-400 ml-auto flex-shrink-0">
                      {new Date(m.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">{label}</p>
      <p className={`font-black text-lg ${accent ?? "text-slate-900 dark:text-white"}`}>{value}</p>
    </div>
  );
}
