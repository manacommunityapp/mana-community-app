import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { userService } from "../../../../services/common/userService";
import { useAuth } from "../../../../contexts/AuthContext";
import type { UserResponse } from "../../../../types/api";

interface ContactNameAutocompleteProps {
  /** Current name text. */
  value: string;
  /** Fired on every keystroke (free typing). */
  onChange: (name: string) => void;
  /** Fired when a member is picked — use it to auto-fill name/email/phone. */
  onSelect: (user: { fullName: string; email: string; phone: string }) => void;
  placeholder?: string;
  /** Styling for the inner <input>, so it can match each form. */
  className?: string;
}

/**
 * Contact-name input with a member typeahead: once the user types 3+ characters
 * it searches community members and shows a dropdown; selecting one auto-fills
 * the contact email and number from that member's profile.
 */
export function ContactNameAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
}: ContactNameAutocompleteProps) {
  const { user } = useAuth();
  // Always scope member search to the logged-in user's own community.
  const communityId = user?.communityId;
  const [results, setResults] = useState<UserResponse[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false); // don't re-search right after a pick
  const lastTypedValue = useRef<string | null>(null); // only search if user actively typed into the input

  // Debounced search on value change (only at >= 3 chars, with a community, and when user typed).
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    // Only execute search if value was modified by user typing, not initial prop or programmatic update
    if (lastTypedValue.current !== value) {
      return;
    }
    const q = value.trim();
    if (!communityId || q.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      userService
        .searchUsers(communityId, q)
        .then((res) => {
          if (active) {
            setResults(res || []);
            setOpen(true);
          }
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, communityId]);

  // Close on outside click.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pick = (u: UserResponse) => {
    skipNextSearch.current = true;
    lastTypedValue.current = null;
    onSelect({ fullName: u.fullName, email: u.email || "", phone: u.phone || "" });
    setOpen(false);
    setResults([]);
  };

  const showEmpty = open && !loading && results.length === 0 && value.trim().length >= 3 && !!communityId && lastTypedValue.current === value;

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          lastTypedValue.current = e.target.value;
          onChange(e.target.value);
        }}
        onFocus={() => {
          if (lastTypedValue.current === value && results.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            e.stopPropagation();
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {loading && (
        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 animate-spin" />
      )}

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl">
          {results.map((u) => (
            <button
              type="button"
              key={u.id}
              onClick={() => pick(u)}
              className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-b-0 cursor-pointer"
            >
              <div className="text-sm font-semibold text-slate-800 truncate">{u.fullName}</div>
              <div className="text-xs text-slate-500 truncate">
                {u.email || "no email"}{u.phone ? ` • ${u.phone}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}

      {showEmpty && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl px-3 py-2 text-xs text-slate-400">
          No matching community members.
        </div>
      )}
    </div>
  );
}
