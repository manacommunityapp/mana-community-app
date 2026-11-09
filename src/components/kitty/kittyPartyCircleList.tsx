import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { kittyPartyService } from "../../services/kittyPartyService";
import type { KittyPartyCircleSummary, CircleCategory } from "../../types/kittyPartyTypes";

const CATEGORIES: { code: CircleCategory | "ALL"; label: string }[] = [
  { code: "ALL", label: "All Circles" },
  { code: "KITTY", label: "Monthly Kitty" },
  { code: "LADIES_CLUB", label: "Ladies Club" },
  { code: "FAMILY", label: "Family Circle" },
  { code: "FRIENDS", label: "Friends & Games" },
  { code: "HOBBY", label: "Hobby Club" },
  { code: "PROFESSIONAL", label: "Women Network" },
];

export const KittyPartyCircleList: React.FC = () => {
  const navigate = useNavigate();
  const [circles, setCircles] = useState<KittyPartyCircleSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCircles();
  }, [selectedCategory]);

  const loadCircles = async () => {
    try {
      setLoading(true);
      const cat = selectedCategory === "ALL" ? undefined : selectedCategory;
      const res = await kittyPartyService.discoverCircles(cat);
      if (res?.content) {
        setCircles(res.content);
      }
    } catch (e) {
      console.error("Failed to load circles", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = circles.filter((c) =>
    c.circleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Social Circles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse active kitty groups, ladies circles, and neighborhood clubs in your community.
          </p>
        </div>
        <Link
          to="/kitty-party/create"
          className="px-4 py-2 bg-pink-600 text-white font-semibold rounded-xl text-sm shadow hover:bg-pink-700 transition w-fit"
        >
          + Create New Circle
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.code}
              onClick={() => setSelectedCategory(cat.code)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedCategory === cat.code
                  ? "bg-pink-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search circles by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>

      {/* Circle Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-400">Discovering circles...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-gray-600 font-medium">No circles match your selection</p>
          <p className="text-xs text-gray-400 mt-1">Try selecting another category or create a new circle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((circle) => (
            <div
              key={circle.id}
              onClick={() => navigate(`/kitty-party/${circle.id}`)}
              className="cursor-pointer border border-gray-200 rounded-xl p-5 hover:border-pink-500 hover:shadow-md transition bg-white flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800">
                    {circle.categoryCode}
                  </span>
                  <span className="text-xs text-gray-400 uppercase font-medium">
                    {circle.privacyType.replace("_", " ")}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900">{circle.circleName}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {circle.description || "Active community circle."}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>👥 {circle.currentMembersCount} / {circle.maxMembers || "∞"} members</span>
                <span className="font-semibold text-pink-600">View Circle →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default KittyPartyCircleList;
