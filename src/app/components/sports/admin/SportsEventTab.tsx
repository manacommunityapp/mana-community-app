import { useState, useEffect, useRef } from "react";
import { Trophy, X } from "lucide-react";
import { TournamentsListTab } from "./TournamentsListTab";
import { ConfigureEventsTab } from "./ConfigureEventsTab";
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
  handleViewPlayers: (id: number, forceReload?: boolean) => void;
  handleViewCaptains: (id: number, forceReload?: boolean) => void;
  handleToggleCaptainNomination?: (eventId: number, open: boolean) => Promise<void> | void;
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
  handleSportPickerSelect: (sport: { name: string; icon: string; iconUrl?: string }) => void;
  handleCreateCustomSport: () => void;
  removeSportForm: (id: string) => void;
  addEventToSportForm: (formId: string) => void;
  removeEventFromSportForm: (formId: string, eventId: string) => void;
  updateSportFormEvent: (formId: string, eventId: string, field: string, value: any) => void;
  handleSportSave: () => void;
  handleSportEdit: (sport: any) => void;
  handleSportDelete: (id: number) => void;
  handleCloseTournament?: (id: number) => void;
  handleCloseEvent?: (id: number) => void;
  handleStartEventRegistration?: (id: number, name?: string) => void;
  handleStartAllPendingEvents?: (tournamentId: number, eventIds?: number[]) => void;
  handleAnnounce?: (id: number, name: string) => void;
  resetSportForm: () => void;
  selectedTemplates: Record<string, string>;
  setSelectedTemplates: any;
  openDropdownEventId: string | null;
  setOpenDropdownEventId: any;
  searchQueries: Record<string, string>;
  setSearchQueries: any;
  /** Lazy-load the Tournaments List data (events + tournaments) on demand. */
  onLoadList?: () => void;
  /** Lazy-load the Configure Events data (sports meta, categories, venues) on demand. */
  onLoadConfig?: () => void;
  /** Reload player categories when the add/update sports event form opens. */
  onLoadCategories?: () => void;
  activeTournamentId?: number | null;
  activeTournamentName?: string;
  activeTournaments?: any[];
  clearTournamentContext?: () => void;
  setTournamentContext?: (id: number, name: string) => void;
  tournamentStartDate?: Date;
  tournamentEndDate?: Date;
  sportsEventSubTab?: "list" | "config";
  setSportsEventSubTab?: (tab: "list" | "config") => void;
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
  handleCloseTournament,
  handleCloseEvent,
  handleStartEventRegistration,
  handleStartAllPendingEvents,
  handleAnnounce,
  handleViewPlayers,
  handleViewCaptains,
  handleToggleCaptainNomination,
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
  onLoadList,
  onLoadConfig,
  onLoadCategories,
  activeTournamentId,
  activeTournamentName,
  activeTournaments,
  clearTournamentContext,
  setTournamentContext,
  tournamentStartDate,
  tournamentEndDate,
  sportsEventSubTab: controlledSubTab,
  setSportsEventSubTab: setControlledSubTab,
}: SportsEventTabProps) {
  const [internalSubTab, setInternalSubTab] = useState<"list" | "config">("list");
  const sportsEventSubTab = controlledSubTab ?? internalSubTab;
  const setSportsEventSubTab = setControlledSubTab ?? setInternalSubTab;

  const onEditEventFromList = (ev: any) => {
    setShowSportPicker(false);
    handleSportEdit(ev);
    setSportsEventSubTab("config");
  };

  // Load each sub-tab's data only when it becomes active (initial "list" on mount,
  // and "config" when the user clicks Configure Events).
  useEffect(() => {
    if (sportsEventSubTab === "list") onLoadList?.();
    else onLoadConfig?.();
  }, [sportsEventSubTab, onLoadList, onLoadConfig]);

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
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            sportsEventSubTab === "config"
              ? "border-indigo-600 text-indigo-600 font-bold"
              : "border-transparent text-slate-500 hover:text-indigo-600"
          }`}
        >
          Configure Events
        </button>
      </div>

      {sportsEventSubTab === "list" ? (
        <TournamentsListTab
          setActiveTab={setActiveTab}
          draftEvents={draftEvents}
          liveEvents={liveEvents}
          completedEvents={completedEvents}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleActivate={handleActivate}
          handleAnnounce={handleAnnounce || (() => {})}
          handleViewPlayers={handleViewPlayers}
          handleViewCaptains={handleViewCaptains}
          handleToggleCaptainNomination={handleToggleCaptainNomination}
          viewingEventId={viewingEventId}
          viewMode={viewMode}
          registrations={registrations}
          nominatedCaptains={nominatedCaptains}
          loadingRegs={loadingRegs}
          handleConfirmRegistration={handleConfirmRegistration}
          handleRejectRegistration={handleRejectRegistration}
          handleConfirmCaptain={handleConfirmCaptain}
          setSelectedEventIdForAdd={setSelectedEventIdForAdd}
          setShowAddPlayerModal={setShowAddPlayerModal}
          setSelectedEventIdForImport={setSelectedEventIdForImport}
          setShowImportModal={setShowImportModal}
          setImportStep={setImportStep}
          activeTournamentId={activeTournamentId}
          setTournamentContext={setTournamentContext}
          clearTournamentContext={clearTournamentContext}
          onGoToConfigureEvents={() => setSportsEventSubTab("config")}
          handleSportEdit={onEditEventFromList}
          handleSportDelete={handleSportDelete}
          handleCloseTournament={handleCloseTournament}
          handleCloseEvent={handleCloseEvent}
          handleStartEventRegistration={handleStartEventRegistration}
          handleStartAllPendingEvents={handleStartAllPendingEvents}
          onOpenSportPicker={() => {
            setSportsEventSubTab("config");
            resetSportForm();
            setShowSportPicker(true);
          }}
        />
      ) : (
        <ConfigureEventsTab
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
          onLoadCategories={onLoadCategories}
          onLoadConfig={onLoadConfig}
          tournamentStartDate={tournamentStartDate}
          tournamentEndDate={tournamentEndDate}
          activeTournamentId={activeTournamentId}
          activeTournamentName={activeTournamentName}
          activeTournaments={activeTournaments}
        />
      )}
    </div>
  );
}
