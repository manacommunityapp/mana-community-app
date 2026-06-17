import {
  User,
  BellOff,
  Ban,
  Search,
  Star,
  Trash2,
  ShieldCheck,
  Image,
  Film,
} from "lucide-react";
import type { Contact } from "./chatData";
import { sharedMedia } from "./chatData";

interface ContactDetailsProps {
  contact: Contact | null;
}

export function ContactDetails({ contact }: ContactDetailsProps) {
  if (!contact) return null;

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Profile Card */}
      <div className="p-6 flex flex-col items-center text-center space-y-3 border-b border-border">
        <div
          className="h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
          style={{
            background: contact.avatarColor,
            boxShadow: "0 8px 25px rgba(99,102,241,0.25)",
          }}
        >
          {contact.avatarInitials}
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <h3 className="text-lg font-bold text-foreground">
              {contact.name}
            </h3>
            {contact.isVerified && (
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-400" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {contact.role}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted/30"
            style={{ border: "1px solid rgba(99,102,241,0.2)" }}
            title="View Profile"
          >
            <User className="h-4 w-4" />
          </button>
          <button
            className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted/30"
            style={{ border: "1px solid rgba(99,102,241,0.2)" }}
            title="Mute Notifications"
          >
            <BellOff className="h-4 w-4" />
          </button>
          <button
            className="h-9 w-9 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 transition-all hover:bg-red-500/10"
            style={{ border: "1px solid rgba(220,38,38,0.2)" }}
            title="Block User"
          >
            <Ban className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 chat-scrollbar">
        {/* Shared Media */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
            Shared Media
          </h4>
          <div className="grid grid-cols-3 gap-1.5">
            {sharedMedia.map((media) => (
              <div
                key={media.id}
                className={`aspect-square rounded-lg bg-gradient-to-br ${media.color} cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center`}
              >
                {media.id.includes("1") || media.id.includes("3") || media.id.includes("5") ? (
                  <Image className="h-4 w-4 text-white/40" />
                ) : (
                  <Film className="h-4 w-4 text-white/40" />
                )}
              </div>
            ))}
          </div>
          <button className="w-full mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1.5 rounded-lg hover:bg-muted/20 transition-all">
            View All Media →
          </button>
        </div>

        {/* Options */}
        <div className="space-y-0.5">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
            Options
          </h4>

          <button className="w-full flex items-center justify-between p-2.5 hover:bg-muted/20 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all group">
            <div className="flex items-center gap-2.5">
              <Search className="h-4 w-4 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
              <span>Search in chat</span>
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-2.5 hover:bg-muted/20 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all group">
            <div className="flex items-center gap-2.5">
              <Star className="h-4 w-4 text-muted-foreground group-hover:text-amber-400 transition-colors" />
              <span>Starred messages</span>
            </div>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: "rgba(99,102,241,0.12)",
                color: "#818cf8",
              }}
            >
              12
            </span>
          </button>

          <button className="w-full flex items-center justify-between p-2.5 hover:bg-red-500/10 rounded-lg text-sm text-red-400 hover:text-red-300 transition-all group">
            <div className="flex items-center gap-2.5">
              <Trash2 className="h-4 w-4" />
              <span>Clear history</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
