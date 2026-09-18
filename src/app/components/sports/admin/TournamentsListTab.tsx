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
  handleAnnounce: (id: number, name: string) => void;
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
  activeTournamentId?: number | null;
  setTournamentContext?: (id: number, name: string) => void;
  clearTournamentContext?: () => void;
  onGoToConfigureEvents?: () => void;
  handleSportEdit?: (ev: any) => void;
  onOpenSportPicker?: () => void;
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
  handleAnnounce,
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
  activeTournamentId,
  setTournamentContext,
  clearTournamentContext,
  onGoToConfigureEvents,
  handleSportEdit,
  onOpenSportPicker,
}: TournamentsListTabProps) {
  const allTournaments = [...draftEvents, ...liveEvents, ...completedEvents];
  
  const onEditEvent = handleSportEdit ? (ev: any) => {
    handleSportEdit(ev);
    setActiveTab("sports-event");
  } : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="text-xl font-bold text-slate-800">Sports Event List</h3>
          <p className="text-sm text-slate-500 mt-1">Manage tournaments and venues for your community</p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenSportPicker && (
            <button
              type="button"
              onClick={onOpenSportPicker}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg border border-indigo-200 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Select a Sport
            </button>
          )}
          <button
            onClick={() => setActiveTab("create-tournament")}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 2px 10px rgba(99,102,241,0.3)" }}
          >
            <Plus className="w-4 h-4" /> New Tournament
          </button>
        </div>
      </div>

      {allTournaments.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
            🏆
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5">No Sport Events Available</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
            There are currently no sports events or tournaments created for your community. Get started by selecting a sport to configure your events.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onOpenSportPicker && (
              <button
                type="button"
                onClick={onOpenSportPicker}
                className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-md hover:brightness-105"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35)"
                }}
              >
                <Plus className="w-4 h-4" /> Select a Sport
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("create-tournament")}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Create Tournament
            </button>
          </div>
        </div>
      ) : (
        <>
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
            onAnnounce={handleAnnounce}
            showActivate
            onEditEvent={onEditEvent}
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
            onAnnounce={handleAnnounce}
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
            onEditEvent={onEditEvent}
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
            onEditEvent={onEditEvent}
          />
        </>
      )}
    </div>
  );
}
