import { SportsEventSection } from "./SportsEventSection";
import type { PlayerCategory, SportsEvent, Venue, SportMeta } from "../../../../types/api";

interface ConfigureEventsTabProps {
  user: any;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  activeCommId: number | undefined;
  activeTab: string;
  setActiveTab: (val: any) => void;
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
  onLoadCategories?: () => void;
}

/** "Configure Events" sub-tab of the Sports Event screen. */
export function ConfigureEventsTab(props: ConfigureEventsTabProps) {
  return (
    <SportsEventSection
      user={props.user}
      activeTab={props.activeTab}
      setActiveTab={props.setActiveTab}
      showSportForm={props.showSportForm}
      setShowSportForm={props.setShowSportForm}
      showSportPicker={props.showSportPicker}
      setShowSportPicker={props.setShowSportPicker}
      sportPickerSearch={props.sportPickerSearch}
      setSportPickerSearch={props.setSportPickerSearch}
      sportSubmitting={props.sportSubmitting}
      sportForms={props.sportForms}
      sportsMeta={props.sportsMeta}
      playerCategories={props.playerCategories}
      venues={props.venues}
      activeEvents={props.activeEvents}
      handleSportPickerSelect={props.handleSportPickerSelect}
      handleCreateCustomSport={props.handleCreateCustomSport}
      removeSportForm={props.removeSportForm}
      addEventToSportForm={props.addEventToSportForm}
      removeEventFromSportForm={props.removeEventFromSportForm}
      updateSportFormEvent={props.updateSportFormEvent}
      handleSportSave={props.handleSportSave}
      handleSportEdit={props.handleSportEdit}
      handleSportDelete={props.handleSportDelete}
      resetSportForm={props.resetSportForm}
      selectedTemplates={props.selectedTemplates}
      setSelectedTemplates={props.setSelectedTemplates}
      openDropdownEventId={props.openDropdownEventId}
      setOpenDropdownEventId={props.setOpenDropdownEventId}
      searchQueries={props.searchQueries}
      setSearchQueries={props.setSearchQueries}
      activeCommId={props.activeCommId}
      isSuperAdmin={props.isSuperAdmin}
      isAdmin={props.isAdmin}
      onLoadCategories={props.onLoadCategories}
    />
  );
}
