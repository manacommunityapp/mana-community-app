import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  Radio, Users, Share2, Maximize2, Camera, MessageSquare,
  ChevronRight, ArrowLeft, Tv, AlertCircle,
} from "lucide-react";
import {
  sportsStreamingService,
  type MatchStream,
  type StreamChatMessage,
} from "../../../services/sports/sportsStreamingService";

interface Props {
  matchId: number;
  matchTitle?: string;
}

const VIEWER_NAME = "You";

export function SportsLiveStream({ matchId, matchTitle }: Props) {
  const navigate = useNavigate();
  const [stream, setStream] = useState<MatchStream>(() =>
    sportsStreamingService.getStream(matchId)
  );
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeCamera = stream.cameras.find((c) => c.id === stream.activeCameraId) ?? stream.cameras[0];

  useEffect(() => {
    // Poll for new messages + viewer count every 5s
    pollRef.current = setInterval(() => {
      const updated = sportsStreamingService.refreshViewerCount(matchId);
      setStream(sportsStreamingService.getStream(matchId));
      void updated;
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [matchId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stream.chatMessages.length]);

  function sendChat() {
    if (!chatInput.trim()) return;
    const updated = sportsStreamingService.postMessage(matchId, chatInput.trim(), VIEWER_NAME);
    setStream(updated);
    setChatInput("");
  }

  function switchCamera(id: string) {
    setStream(sportsStreamingService.switchCamera(matchId, id));
  }

  function copyLink() {
    const url = `${window.location.origin}/sports/match/${matchId}/stream`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  if (stream.status === "OFFLINE") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Tv className="w-7 h-7 text-slate-400" />
        </div>
        <div>
          <p className="font-black text-slate-900 dark:text-white text-lg">Stream not started yet</p>
          <p className="text-sm text-slate-500 mt-1">The organiser hasn't gone live for this match.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  if (stream.status === "ENDED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-slate-400" />
        </div>
        <p className="font-black text-slate-900 dark:text-white text-lg">Stream ended</p>
        <p className="text-sm text-slate-500">This broadcast has concluded.</p>
        <Link to={`/sports/match/${matchId}`} className="text-sm font-bold text-indigo-600 hover:underline">
          View match scorecard →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-black/90 z-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-white/70 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate">
            {stream.title || matchTitle || `Match #${matchId}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600 rounded-full text-white text-[10px] font-black uppercase tracking-wide">
            <Radio className="w-2.5 h-2.5" /> Live
          </span>
          <span className="flex items-center gap-1 text-white/70 text-xs">
            <Users className="w-3.5 h-3.5" /> {stream.viewerCount || 1}
          </span>
          <button type="button" onClick={copyLink} className="text-white/70 hover:text-white cursor-pointer">
            <Share2 className="w-4 h-4" />
          </button>
          {copied && (
            <span className="text-green-400 text-xs font-bold">Copied!</span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Player area */}
        <div className="flex-1 flex flex-col bg-black">
          {/* Camera switcher */}
          {stream.cameras.length > 1 && (
            <div className="flex gap-2 px-3 py-2 bg-black/80 overflow-x-auto">
              {stream.cameras.map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => switchCamera(cam.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                    cam.id === stream.activeCameraId
                      ? "bg-indigo-600 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  {cam.label}
                </button>
              ))}
            </div>
          )}

          {/* Video embed */}
          <div className="relative flex-1 bg-black">
            {activeCamera ? (
              <iframe
                key={activeCamera.id}
                src={activeCamera.embedUrl}
                className="absolute inset-0 w-full h-full"
                style={{ minHeight: "240px" }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={activeCamera.label}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 gap-3">
                <Maximize2 className="w-10 h-10" />
                <p className="text-sm">No camera feed added yet</p>
              </div>
            )}
          </div>

          {/* Mobile chat toggle */}
          <button
            type="button"
            onClick={() => setShowChat((s) => !s)}
            className="lg:hidden flex items-center justify-center gap-2 py-2 bg-slate-900 text-white/70 hover:text-white text-xs font-bold cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            {showChat ? "Hide chat" : "Show chat"}
          </button>
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div className="flex flex-col w-full lg:w-80 bg-slate-900 border-l border-slate-800 max-h-[50vh] lg:max-h-none">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
              <p className="text-white text-xs font-black uppercase tracking-wide">Live Chat</p>
              <span className="text-white/40 text-[10px]">{stream.chatMessages.length} messages</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-[120px]">
              {stream.chatMessages.length === 0 && (
                <p className="text-slate-500 text-xs text-center pt-4">No messages yet. Say something!</p>
              )}
              {stream.chatMessages.map((msg: StreamChatMessage) => (
                <ChatBubble key={msg.id} msg={msg} />
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-800">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                maxLength={200}
                placeholder="Type a message…"
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={sendChat}
                disabled={!chatInput.trim()}
                className="flex-shrink-0 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer disabled:cursor-default transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Score link */}
            <div className="px-3 py-2 border-t border-slate-800">
              <Link
                to={`/sports/match/${matchId}/live`}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
              >
                <span className="text-white/70 text-xs font-bold">Live Scorecard</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/40" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: StreamChatMessage }) {
  const time = new Date(msg.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (msg.isCommentary) {
    return (
      <div className="flex items-start gap-2 bg-indigo-900/40 border border-indigo-700/40 rounded-lg px-2.5 py-1.5">
        <Radio className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="text-indigo-300 text-[10px] font-black uppercase tracking-wide">Commentary</span>
          <p className="text-white text-xs leading-snug mt-0.5">{msg.text}</p>
        </div>
        <span className="text-slate-500 text-[9px] ml-auto flex-shrink-0 mt-0.5">{time}</span>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-indigo-400 text-[10px] font-bold flex-shrink-0">{msg.authorName}</span>
      <span className="text-white/80 text-xs leading-snug flex-1 min-w-0">{msg.text}</span>
      <span className="text-slate-600 text-[9px] flex-shrink-0">{time}</span>
    </div>
  );
}
