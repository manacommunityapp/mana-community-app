import React, { useState } from "react";
import { useNavigate } from "react-router";
import { kittyPartyService } from "../../services/kittyPartyService";

export const KittyPartyCreateCircle: React.FC = () => {
  const navigate = useNavigate();
  const [circleName, setCircleName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryCode, setCategoryCode] = useState("KITTY");
  const [privacyType, setPrivacyType] = useState("PRIVATE");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [maxMembers, setMaxMembers] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleName.trim()) {
      setError("Circle name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await kittyPartyService.createCircle({
        circleName: circleName.trim(),
        description: description.trim() || undefined,
        categoryCode,
        privacyType,
        approvalRequired,
        maxMembers,
      });

      if (res?.id) {
        navigate(`/kitty-party/${res.id}`);
      } else {
        navigate("/kitty-party");
      }
    } catch (err: any) {
      console.error("Failed to create circle", err);
      setError(err?.message || "Failed to create circle. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800 uppercase tracking-wide">
            New Circle
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Create Social Circle</h1>
          <p className="text-sm text-gray-500 mt-1">
            Setup your kitty group, ladies circle, or neighborhood gathering.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Circle Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mana Queens Monthly Kitty"
              value={circleName}
              onChange={(e) => setCircleName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
            >
              <option value="KITTY">Monthly Kitty Party</option>
              <option value="LADIES_CLUB">Ladies Social Club</option>
              <option value="FAMILY">Family Circle</option>
              <option value="FRIENDS">Friends & Weekend Games</option>
              <option value="HOBBY">Hobby & Crafts Circle</option>
              <option value="PROFESSIONAL">Women Entrepreneurs Network</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Privacy & Visibility
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: "PRIVATE", title: "Private", desc: "Discoverable, request required" },
                { type: "INVITE_ONLY", title: "Invite Only", desc: "Hidden, secret link only" },
                { type: "COMMUNITY_PUBLIC", title: "Public", desc: "Open to community residents" },
              ].map((p) => (
                <button
                  type="button"
                  key={p.type}
                  onClick={() => setPrivacyType(p.type)}
                  className={`p-3 rounded-xl border text-left transition ${
                    privacyType === p.type
                      ? "border-pink-500 bg-pink-50/50 ring-1 ring-pink-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-bold text-xs text-gray-900">{p.title}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Maximum Members
            </label>
            <input
              type="number"
              min="2"
              max="100"
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Description & Rules
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Monthly meetup on the first Saturday. Monthly contribution ₹2,000 for rotating kitty."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="approvalReq"
              checked={approvalRequired}
              onChange={(e) => setApprovalRequired(e.target.checked)}
              className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
            />
            <label htmlFor="approvalReq" className="text-xs text-gray-700 font-medium">
              Require admin approval before new members can join
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-pink-600 text-white text-sm font-bold rounded-xl shadow hover:bg-pink-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Creating..." : "Create Circle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default KittyPartyCreateCircle;
