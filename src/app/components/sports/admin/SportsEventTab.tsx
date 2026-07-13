import { useState, useEffect } from "react";
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
  /** Lazy-load the Tournaments List data (events + tournaments) on demand. */
  onLoadList?: () => void;
  /** Lazy-load the Configure Events data (sports meta, categories, venues) on demand. */
  onLoadConfig?: () => void;
  /** Reload player categories when the add/update sports event form opens. */
  onLoadCategories?: () => void;
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
  onLoadList,
  onLoadConfig,
  onLoadCategories,
}: SportsEventTabProps) {
  const [sportsEventSubTab, setSportsEventSubTab] = useState<"list" | "config">("list");

  // Load each sub-tab's data only when it becomes active (initial "list" on mount,
  // and "config" when the user clicks Configure Events).
  useEffect(() => {
    if (sportsEventSubTab === "list") onLoadList?.();
    else onLoadConfig?.();
  }, [sportsEventSubTab, onLoadList, onLoadConfig]);

  return (
    <div className="space-y-6">
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
        <TournamentsListTab
          setActiveTab={setActiveTab}
          draftEvents={draftEvents}
          liveEvents={liveEvents}
          completedEvents={completedEvents}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleActivate={handleActivate}
          handleViewPlayers={handleViewPlayers}
          handleViewCaptains={handleViewCaptains}
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
        />
      )}
    </div>
  );
}
