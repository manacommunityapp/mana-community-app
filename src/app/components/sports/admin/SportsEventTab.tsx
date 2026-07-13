import { useState, useEffect } from "react";
import { Plus, Trophy, X } from "lucide-react";
import { TournamentSection } from "./TournamentSection";
import { SportsEventSection } from "./SportsEventSection";
import type { PlayerCategory, SportsEvent, Venue, SportMeta, TournamentRegistration, AuctionTeam } from "../../../../types/api";

interface SportsEventTabProps {
  user: any;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  activeCommId: number | undefined;
  activeTab: string;
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
  showSportForm: boolean;
  setShowSportForm: (show: boolean) => void;
  showSportPicker: boolean;
  setShowSportPicker: (show: boolean) => void;
  sportPickerSearch: string;
  setSportPickerSearch: (search: string) => void;
  sportSubmitting: boolean;
  sportForms: any[];
  sportsMeta: SportMeta[];
  playerCategories: PlayerCategory[];
  venues: Venue[];
  activeEvents: SportsEvent[];
  handleSportPickerSelect: (sport: { name: string; icon: string }) => void;
  handleCreateCustomSport: () => void;
  removeSportForm: (id: string) => void;
  addEventToSportForm: (formId: string) => void;
  removeEventFromSportForm: (formId: string, eventId: string) => void;
  updateSportFormEvent: (formId: string, eventId: string, field: string, value: any) => void;
  handleSportSave: () => void;
  handleSportEdit: (sport: any) => void;
  handleSportDelete: (id: number) => void;
  resetSportForm: () => void;
  selectedTemplates: Record<string, string>;
  setSelectedTemplates: any;
  openDropdownEventId: string | null;
  setOpenDropdownEventId: any;
  searchQueries: Record<string, string>;
  setSearchQueries: any;
  activeTournamentId?: number | null;
  activeTournamentName?: string;
  clearTournamentContext?: () => void;
}

export function SportsEventTab({
  user,
  isAdmin,
  isSuperAdmin,
  activeCommId,
  activeTab,
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
  showSportForm,
  setShowSportForm,
  showSportPicker,
  setShowSportPicker,
  sportPickerSearch,
  setSportPickerSearch,
  sportSubmitting,
  sportForms,
  sportsMeta,
  playerCategories,
  venues,
  activeEvents,
  handleSportPickerSelect,
  handleCreateCustomSport,
  removeSportForm,
  addEventToSportForm,
  removeEventFromSportForm,
  updateSportFormEvent,
  handleSportSave,
  handleSportEdit,
  handleSportDelete,
  resetSportForm,
  selectedTemplates,
  setSelectedTemplates,
  openDropdownEventId,
  setOpenDropdownEventId,
  searchQueries,
  setSearchQueries,
  activeTournamentId,
  activeTournamentName,
  clearTournamentContext,
}: SportsEventTabProps) {
  const [sportsEventSubTab, setSportsEventSubTab] = useState<"list" | "config">(
    activeTournamentId ? "config" : "list"
  );

  useEffect(() => {
    if (activeTournamentId) {
      setSportsEventSubTab("config");
      setShowSportPicker(true);
    }
  }, [activeTournamentId, setShowSportPicker]);

  return (
    <div className="space-y-6">
      {/* Tournament context banner */}
      {activeTournamentId && activeTournamentName && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-left">
              <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">Adding events to tournament</p>
              <p className="text-sm font-bold text-indigo-700">{activeTournamentName}</p>
            </div>
          </div>
          <button
            onClick={() => {
              clearTournamentContext?.();
              setSportsEventSubTab("list");
            }}
            className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer text-indigo-400 hover:text-indigo-600"
            title="Done adding events"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-tab toggle */}
      <div className="flex border-b border-slate-100 pb-px gap-6 mb-4">
        <button
          onClick={() => setSportsEventSubTab("list")}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${sportsEventSubTab === "list" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-indigo-600"}`}
        >
          Tournaments List
        </button>
        <button
          onClick={() => setSportsEventSubTab("config")}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${sportsEventSubTab === "config" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-indigo-600"}`}
        >
          Configure Events
        </button>
      </div>

      {sportsEventSubTab === "list" ? (
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
      ) : (
        <SportsEventSection
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showSportForm={showSportForm}
          setShowSportForm={setShowSportForm}
          showSportPicker={showSportPicker}
          setShowSportPicker={setShowSportPicker}
          sportPickerSearch={sportPickerSearch}
          setSportPickerSearch={setSportPickerSearch}
          sportSubmitting={sportSubmitting}
          sportForms={sportForms}
          sportsMeta={sportsMeta}
          playerCategories={playerCategories}
          venues={venues}
          activeEvents={activeEvents}
          handleSportPickerSelect={handleSportPickerSelect}
          handleCreateCustomSport={handleCreateCustomSport}
          removeSportForm={removeSportForm}
          addEventToSportForm={addEventToSportForm}
          removeEventFromSportForm={removeEventFromSportForm}
          updateSportFormEvent={updateSportFormEvent}
          handleSportSave={handleSportSave}
          handleSportEdit={handleSportEdit}
          handleSportDelete={handleSportDelete}
          resetSportForm={resetSportForm}
          selectedTemplates={selectedTemplates}
          setSelectedTemplates={setSelectedTemplates}
          openDropdownEventId={openDropdownEventId}
          setOpenDropdownEventId={setOpenDropdownEventId}
          searchQueries={searchQueries}
          setSearchQueries={setSearchQueries}
          activeCommId={activeCommId}
          isSuperAdmin={isSuperAdmin}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
