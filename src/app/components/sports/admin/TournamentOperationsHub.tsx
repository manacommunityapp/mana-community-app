import { useState, useEffect } from "react";
import {
  Layers, Send, Calendar, FileText
} from "lucide-react";
import { TournamentEventSelector } from "./TournamentEventSelector";
import { TournamentStageManager } from "./TournamentStageManager";
import { SchedulePublicationManager } from "./SchedulePublicationManager";
import { ScheduleVersionHistory } from "./ScheduleVersionHistory";
import { ReserveDayManager } from "./PostponementManager";
import { ScheduleAdminTab } from "./ScheduleAdminTab";
import { tournamentStageService } from "../../../../services/sports/tournamentStageService";
import type { ReserveDay } from "../../../../types/tournamentStage";

interface TournamentOperationsHubProps {
  initialConfigId?: number;
  initialSubTab?: "stages" | "fixtures" | "publication" | "reserve_days";
}

export function TournamentOperationsHub({ initialConfigId, initialSubTab = "stages" }: TournamentOperationsHubProps) {
  const [configId, setConfigId] = useState<number>(initialConfigId || 0);
  const [activeSubTab, setActiveSubTab] = useState<"stages" | "fixtures" | "publication" | "reserve_days">(initialSubTab);
  const [reserveDays, setReserveDays] = useState<ReserveDay[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const fetchReserveDays = async () => {
    if (!configId) return;
    try {
      const data = await tournamentStageService.getReserveDays(configId);
      setReserveDays(data);
    } catch {
      setReserveDays([]);
    }
  };

  useEffect(() => {
    fetchReserveDays();
  }, [configId, refreshTrigger]);

  return (
    <div className="space-y-4">
      {/* Event / Config Selector bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
        <TournamentEventSelector
          onConfigIdChange={setConfigId}
          initialConfigId={initialConfigId}
        />
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab("stages")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === "stages"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Stages &amp; Qualification
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("fixtures")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === "fixtures"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Fixtures &amp; Rescheduling
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("publication")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === "publication"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          Publication &amp; Versions
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("reserve_days")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === "reserve_days"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Reserve Days ({reserveDays.length})
        </button>
      </div>

      {/* Sub-tab Contents */}
      {configId > 0 ? (
        <div>
          {activeSubTab === "stages" && (
            <TournamentStageManager configId={configId} />
          )}

          {activeSubTab === "fixtures" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4">
              <ScheduleAdminTab />
            </div>
          )}

          {activeSubTab === "publication" && (
            <div className="space-y-6">
              <SchedulePublicationManager configId={configId} />
              <div className="border-t border-slate-200/70 pt-6">
                <ScheduleVersionHistory configId={configId} />
              </div>
            </div>
          )}

          {activeSubTab === "reserve_days" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <ReserveDayManager
                configId={configId}
                reserveDays={reserveDays}
                onRefresh={() => setRefreshTrigger(prev => prev + 1)}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
          <p className="text-xs font-medium">Please select a tournament / event above to manage operations.</p>
        </div>
      )}
    </div>
  );
}
