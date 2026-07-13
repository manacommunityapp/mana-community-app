import { Plus } from "lucide-react";
import { TournamentSection } from "./TournamentSection";
import type { SportsEvent, TournamentRegistration, AuctionTeam } from "../../../../types/api";

interface TournamentsListTabProps {
  setActiveTab: (val: any) => void;
  draftEvents: SportsEvent[];
  liveEvents: SportsEvent[];
  completedEvents: SportsEvent[];
  handleEdit: (e: SportsEvent) => void;
  handleDelete: (id: number) => void;
  handleActivate: (id: number) => void;
  handleViewPlayers: (id: number) => void;
  handleViewCaptains: (id: number) => void;
  viewingEventId: number | null;
  viewMode: "players" | "captains" | null | undefined;
  registrations: TournamentRegistration[];
  nominatedCaptains: AuctionTeam[];
  loadingRegs: boolean;
  handleConfirmRegistration: (regId: number) => void;
  handleRejectRegistration: (regId: number) => void;
  handleConfirmCaptain: (teamId: number, confirm: boolean) => void;
  setSelectedEventIdForAdd: (id: number) => void;
  setShowAddPlayerModal: (show: boolean) => void;
  setSelectedEventIdForImport: (id: number) => void;
  setShowImportModal: (show: boolean) => void;
  setImportStep: (step: number) => void;
}

/** "Tournaments List" sub-tab of the Sports Event screen. */
export function TournamentsListTab({
  setActiveTab,
  draftEvents,
  liveEvents,
  completedEvents,
  handleEdit,
  handleDelete,
  handleActivate,
  handleViewPlayers,
  handleViewCaptains,
  viewingEventId,
  viewMode,
  registrations,
  nominatedCaptains,
  loadingRegs,
  handleConfirmRegistration,
  handleRejectRegistration,
  handleConfirmCaptain,
  setSelectedEventIdForAdd,
  setShowAddPlayerModal,
  setSelectedEventIdForImport,
  setShowImportModal,
  setImportStep,
}: TournamentsListTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="text-xl font-bold text-slate-800">Sports Event List</h3>
          <p className="text-sm text-slate-500 mt-1">Manage tournaments and venues for your community</p>
        </div>
        <button
          onClick={() => setActiveTab("create-tournament")}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 2px 10px rgba(99,102,241,0.3)" }}
        >
          <Plus className="w-4 h-4" /> New Tournament
        </button>
      </div>

      {/* Draft Tournaments */}
      <TournamentSection
        title="Draft Tournaments"
        badge={draftEvents.length}
        badgeColor="bg-slate-100 text-slate-600 border border-slate-200"
        emptyText="No draft tournaments"
        events={draftEvents}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onActivate={handleActivate}
        showActivate
      />

      {/* Active Tournaments */}
      <TournamentSection
        title="Open for Registration"
        badge={liveEvents.length}
        badgeColor="bg-emerald-50 text-emerald-600 border border-emerald-200"
        emptyText="No active tournaments"
        events={liveEvents}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewPlayers={handleViewPlayers}
        onViewCaptains={handleViewCaptains}
        viewingEventId={viewingEventId}
        viewMode={viewMode || undefined}
        registrations={registrations}
        nominatedCaptains={nominatedCaptains}
        loadingRegs={loadingRegs}
        onConfirmRegistration={handleConfirmRegistration}
        onRejectRegistration={handleRejectRegistration}
        onConfirmCaptain={handleConfirmCaptain}
        onAddParticipant={(eventId) => {
          setSelectedEventIdForAdd(eventId);
          setShowAddPlayerModal(true);
        }}
        onImportParticipants={(eventId) => {
          setSelectedEventIdForImport(eventId);
          setShowImportModal(true);
          setImportStep(1);
        }}
      />

      {/* Completed Tournaments */}
      <TournamentSection
        title="Completed Tournaments"
        badge={completedEvents.length}
        badgeColor="bg-blue-50 text-blue-600 border border-blue-200"
        emptyText="No completed tournaments"
        events={completedEvents}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
