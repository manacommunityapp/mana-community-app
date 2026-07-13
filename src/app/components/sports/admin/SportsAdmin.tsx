import { useSportsAdminState } from "./useSportsAdminState";
import { DashboardTab } from "./DashboardTab";
import { TeamsTab } from "./TeamsTab";
import { ScheduleTab, ResultsTab, SettingsTab } from "./PlaceholderTabs";
import { CreateTournamentTab } from "./CreateTournamentTab";
import { SportsEventTab } from "./SportsEventTab";
import { NotificationSetupModal } from "./NotificationSetupModal";
import { AddPlayerModal } from "./AddPlayerModal";
import { ImportPlayersModal } from "./ImportPlayersModal";
import { SportEventConfigModal } from "./SportEventConfigModal";
import { VenueDetailsModal } from "./VenueDetailsModal";
import { VenueCreationSection } from "./VenueCreationSection";
import { PlayerCategorySection } from "./PlayerCategorySection";
import { SportsMetaSection } from "./SportsMetaSection";
import { RegistrationOpenModal } from "./RegistrationOpenModal";
import "../SportsAuction.css";

export function SportsAdmin() {
  const s = useSportsAdminState();

  return (
    <div className="auction-hub-wrapper">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-title">Admin Hub</div>
        </div>
        <div className="nav-section">
          <div className="nav-label">Management</div>
          {s.menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${s.activeTab === item.id ? "active" : ""}`}
              onClick={() => s.setActiveTab(item.id)}
            >
              <div className="nav-dot"></div>
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      <main className="main-content">
        <div className="page active">
          {s.activeTab !== "dashboard" && (
            <div className="page-hdr">
              <div>
                <div className="page-title">
                  {s.menuItems.find(m => m.id === s.activeTab)?.label || "Admin"}
                </div>
                <div className="page-sub">Manage community sports events and rules</div>
              </div>
            </div>
          )}

          {s.activeTab === "dashboard" && (
            <DashboardTab
              activeTournaments={s.activeTournaments}
              teamsList={s.teamsList}
              pendingList={s.pendingList}
              venues={s.venues}
              activeEvents={s.activeEvents}
              approveTeam={s.approveTeam}
              setActiveTab={s.setActiveTab}
            />
          )}

          {s.activeTab === "sports-event" && (
            <SportsEventTab
              user={s.user}
              isAdmin={s.isAdmin}
              isSuperAdmin={s.isSuperAdmin}
              activeCommId={s.activeCommId}
              activeTab={s.activeTab}
              setActiveTab={s.setActiveTab}
              draftEvents={s.draftEvents}
              liveEvents={s.liveEvents}
              completedEvents={s.completedEvents}
              handleEdit={s.handleEdit}
              handleDelete={s.handleDelete}
              handleActivate={s.handleActivate}
              handleViewPlayers={s.handleViewPlayers}
              handleViewCaptains={s.handleViewCaptains}
              viewingEventId={s.viewingEventId}
              viewMode={s.viewMode}
              registrations={s.registrations}
              nominatedCaptains={s.nominatedCaptains}
              loadingRegs={s.loadingRegs}
              handleConfirmRegistration={s.handleConfirmRegistration}
              handleRejectRegistration={s.handleRejectRegistration}
              handleConfirmCaptain={s.handleConfirmCaptain}
              setSelectedEventIdForAdd={s.setSelectedEventIdForAdd}
              setShowAddPlayerModal={s.setShowAddPlayerModal}
              setSelectedEventIdForImport={s.setSelectedEventIdForImport}
              setShowImportModal={s.setShowImportModal}
              setImportStep={s.setImportStep}
              showSportForm={s.showSportForm}
              setShowSportForm={s.setShowSportForm}
              showSportPicker={s.showSportPicker}
              setShowSportPicker={s.setShowSportPicker}
              sportPickerSearch={s.sportPickerSearch}
              setSportPickerSearch={s.setSportPickerSearch}
              sportSubmitting={s.sportSubmitting}
              sportForms={s.sportForms}
              sportsMeta={s.sportsMeta}
              playerCategories={s.playerCategories}
              venues={s.venues}
              activeEvents={s.activeEvents}
              handleSportPickerSelect={s.handleSportPickerSelect}
              handleCreateCustomSport={s.handleCreateCustomSport}
              removeSportForm={s.removeSportForm}
              addEventToSportForm={s.addEventToSportForm}
              removeEventFromSportForm={s.removeEventFromSportForm}
              updateSportFormEvent={s.updateSportFormEvent}
              handleSportSave={s.handleSportSave}
              handleSportEdit={s.handleSportEdit}
              handleSportDelete={s.handleSportDelete}
              resetSportForm={s.resetSportForm}
              selectedTemplates={s.selectedTemplates}
              setSelectedTemplates={s.setSelectedTemplates}
              openDropdownEventId={s.openDropdownEventId}
              setOpenDropdownEventId={s.setOpenDropdownEventId}
              searchQueries={s.searchQueries}
              setSearchQueries={s.setSearchQueries}
              activeTournamentId={s.activeTournamentId}
              activeTournamentName={s.activeTournamentName}
              clearTournamentContext={s.clearTournamentContext}
            />
          )}

          {s.activeTab === "create-tournament" && (
            <CreateTournamentTab
              user={s.user}
              editingEventId={s.editingEventId}
              eventName={s.eventName}
              setEventName={s.setEventName}
              selectedCommId={s.selectedCommId}
              setSelectedCommId={s.setSelectedCommId}
              maxPax={s.maxPax}
              setMaxPax={s.setMaxPax}
              description={s.description}
              setDescription={s.setDescription}
              communities={s.communities}
              startDate={s.startDate}
              setStartDate={s.setStartDate}
              endDate={s.endDate}
              setEndDate={s.setEndDate}
              regStartDate={s.regStartDate}
              setRegStartDate={s.setRegStartDate}
              regEndDate={s.regEndDate}
              setRegEndDate={s.setRegEndDate}
              startTime={s.startTime}
              setStartTime={s.setStartTime}
              dueTime={s.dueTime}
              setDueTime={s.setDueTime}
              tournamentLevel={s.tournamentLevel}
              setTournamentLevel={s.setTournamentLevel}
              bannerImage={s.bannerImage}
              setBannerImage={s.setBannerImage}
              handleBannerUpload={s.handleBannerUpload}
              eventContactName={s.eventContactName}
              setEventContactName={s.setEventContactName}
              eventContactNumber={s.eventContactNumber}
              setEventContactNumber={s.setEventContactNumber}
              eventContactEmail={s.eventContactEmail}
              setEventContactEmail={s.setEventContactEmail}
              otherContacts={s.otherContacts}
              addOtherContact={s.addOtherContact}
              removeOtherContact={s.removeOtherContact}
              updateOtherContact={s.updateOtherContact}
              sponsors={s.sponsors}
              addSponsor={s.addSponsor}
              removeSponsor={s.removeSponsor}
              updateSponsor={s.updateSponsor}
              allowAdminChat={s.allowAdminChat}
              totalEnabledCount={s.totalEnabledCount}
              globalChannels={s.globalChannels}
              customTriggers={s.customTriggers}
              totalOutputSends={s.totalOutputSends}
              setShowNotificationModal={s.setShowNotificationModal}
              submitting={s.submitting}
              handleSave={s.handleSave}
              resetForm={s.resetForm}
              setActiveTab={s.setActiveTab}
            />
          )}

          {s.activeTab === "teams" && (
            <TeamsTab
              activeTournaments={s.activeTournaments}
              activeEvents={s.activeEvents}
              communityId={s.user?.role !== "SUPER_ADMIN" ? s.user?.communityId : null}
              isSuperAdmin={s.user?.role === "SUPER_ADMIN"}
            />
          )}

          {s.activeTab === "schedule" && <ScheduleTab />}
          {s.activeTab === "results" && <ResultsTab />}
          {s.activeTab === "settings" && <SettingsTab />}

          {s.activeTab === "create-venue" && (
            <VenueCreationSection
              user={s.user}
              communities={s.communities}
              venueCommunities={s.venueCommunities}
              activeTab={s.activeTab}
              setActiveTab={s.setActiveTab}
              showVenueForm={s.showVenueForm}
              setShowVenueForm={s.setShowVenueForm}
              editingVenueId={s.editingVenueId}
              venueName={s.venueName}
              setVenueName={s.setVenueName}
              venueType={s.venueType}
              setVenueType={s.setVenueType}
              venueCommId={s.venueCommId}
              setVenueCommId={s.setVenueCommId}
              venueAddress={s.venueAddress}
              setVenueAddress={s.setVenueAddress}
              venueCity={s.venueCity}
              setVenueCity={s.setVenueCity}
              venueArea={s.venueArea}
              setVenueArea={s.setVenueArea}
              venueCapacity={s.venueCapacity}
              setVenueCapacity={s.setVenueCapacity}
              venuePinCode={s.venuePinCode}
              setVenuePinCode={s.setVenuePinCode}
              venueMapLink={s.venueMapLink}
              setVenueMapLink={s.setVenueMapLink}
              venueOpeningTime={s.venueOpeningTime}
              setVenueOpeningTime={s.setVenueOpeningTime}
              venueClosingTime={s.venueClosingTime}
              setVenueClosingTime={s.setVenueClosingTime}
              venueContacts={s.venueContacts}
              addVenueContact={s.addVenueContact}
              removeVenueContact={s.removeVenueContact}
              updateVenueContact={s.updateVenueContact}
              courts={s.courts}
              addCourt={s.addCourt}
              removeCourt={s.removeCourt}
              updateCourt={s.updateCourt}
              venueSubmitting={s.venueSubmitting}
              resetVenueForm={s.resetVenueForm}
              handleVenueSave={s.handleVenueSave}
              venues={s.venues}
              hiddenVenues={s.hiddenVenues}
              handleVenueEdit={s.handleVenueEdit}
              handleVenueHide={s.handleVenueHide}
              handleVenueDelete={s.handleVenueDelete}
              refreshVenues={s.refreshVenues}
            />
          )}

          {s.activeTab === "player-category" && (
            <PlayerCategorySection
              user={s.user}
              communities={s.communities}
              playerCategories={s.playerCategories}
              showCategoryForm={s.showCategoryForm}
              setShowCategoryForm={s.setShowCategoryForm}
              editingCategoryId={s.editingCategoryId}
              categoryName={s.categoryName}
              setCategoryName={s.setCategoryName}
              categoryType={s.categoryType}
              setCategoryType={s.setCategoryType}
              categoryGender={s.categoryGender}
              setCategoryGender={s.setCategoryGender}
              categoryMinAge={s.categoryMinAge}
              setCategoryMinAge={s.setCategoryMinAge}
              categoryMaxAge={s.categoryMaxAge}
              setCategoryMaxAge={s.setCategoryMaxAge}
              categoryCommId={s.categoryCommId}
              setCategoryCommId={s.setCategoryCommId}
              categoryDescription={s.categoryDescription}
              setCategoryDescription={s.setCategoryDescription}
              categorySubmitting={s.categorySubmitting}
              resetCategoryForm={s.resetCategoryForm}
              handleCategorySave={s.handleCategorySave}
              handleCategoryEdit={s.handleCategoryEdit}
              handleCategoryDelete={s.handleCategoryDelete}
              setActiveTab={s.setActiveTab}
            />
          )}

          {s.activeTab === "sports-meta" && s.isAdmin && (
            <SportsMetaSection isAdmin={s.isAdmin} />
          )}
        </div>
      </main>

      <NotificationSetupModal
        showNotificationModal={s.showNotificationModal}
        setShowNotificationModal={s.setShowNotificationModal}
        triggerStates={s.triggerStates}
        setTriggerStates={s.setTriggerStates}
        customTriggers={s.customTriggers}
        setCustomTriggers={s.setCustomTriggers}
        globalChannels={s.globalChannels}
        setGlobalChannels={s.setGlobalChannels}
        expandedTrigger={s.expandedTrigger}
        setExpandedTrigger={s.setExpandedTrigger}
        previewTrigger={s.previewTrigger}
        setPreviewTrigger={s.setPreviewTrigger}
        eventName={s.eventName}
        startTime={s.startTime}
        regStartDate={s.regStartDate}
        selectedVenueDetails={s.selectedVenueDetails}
        allTriggersToRender={s.allTriggersToRender}
        getCompiledPreviewBody={s.getCompiledPreviewBody}
        currentActiveChannels={s.currentActiveChannels}
        previewCount={s.previewCount}
        previewPercentage={s.previewPercentage}
        totalEnabledCount={s.totalEnabledCount}
        totalOutputSends={s.totalOutputSends}
        toggleGlobalChannel={s.toggleGlobalChannel}
        toggleTriggerRow={s.toggleTriggerRow}
        handleTriggerFieldChange={s.handleTriggerFieldChange}
        toggleRecipient={s.toggleRecipient}
        toggleTriggerChannel={s.toggleTriggerChannel}
        addCustomTrigger={s.addCustomTrigger}
        removeCustomTrigger={s.removeCustomTrigger}
        getTournamentStartDateTime={s.getTournamentStartDateTime}
        formatINRDate={s.formatINRDate}
      />

      <AddPlayerModal
        showAddPlayerModal={s.showAddPlayerModal}
        setShowAddPlayerModal={s.setShowAddPlayerModal}
        addPlayerForms={s.addPlayerForms}
        setAddPlayerForms={s.setAddPlayerForms}
        communityUsers={s.communityUsers}
        loadingUsers={s.loadingUsers}
        friendSearchQuery={s.friendSearchQuery}
        setFriendSearchQuery={s.setFriendSearchQuery}
        filteredFriends={s.filteredFriends}
        handleSelectFriend={s.handleSelectFriend}
        handleAddNewPlayerCard={s.handleAddNewPlayerCard}
        handleDeletePlayerCard={s.handleDeletePlayerCard}
        handleAddPlayerSubmit={s.handleAddPlayerSubmit}
        submitting={s.submitting}
        playerCategories={s.playerCategories}
        formatDob={s.formatDob}
      />

      <ImportPlayersModal
        showImportModal={s.showImportModal}
        setShowImportModal={s.setShowImportModal}
        csvFile={s.csvFile}
        parsedRows={s.parsedRows}
        parsingError={s.parsingError}
        importing={s.importing}
        importProgress={s.importProgress}
        handleDownloadSample={s.handleDownloadSample}
        handleFileChange={s.handleFileChange}
        handleImportSubmit={s.handleImportSubmit}
        setCsvFile={s.setCsvFile}
        setParsedRows={s.setParsedRows}
      />

      <SportEventConfigModal
        isOpen={s.showSportConfigModal}
        onClose={() => {
          s.setShowSportConfigModal(false);
          s.setConfiguringSportId(null);
        }}
        configuringSportId={s.configuringSportId}
        selectedSportsWithEvents={s.selectedSportsWithEvents}
        addEventToSport={s.addEventToSport}
        removeEvent={s.removeEvent}
        updateEventField={s.updateEventField}
        playerCategories={s.playerCategories}
      />

      <VenueDetailsModal
        isOpen={s.showVenueDetailsModal}
        onClose={() => s.setShowVenueDetailsModal(false)}
        selectedVenueDetails={s.selectedVenueDetails}
        loadingVenueDetails={s.loadingVenueDetails}
        onEditVenue={s.selectedVenueDetails ? () => {
          s.setVenueCommId(s.selectedVenueDetails!.communityId || "");
          s.setVenueType(s.selectedVenueDetails!.venueType || "");
          s.setActiveTab("create-venue");
          s.setShowVenueForm(true);
        } : undefined}
      />

      {s.activatingTournament && (
        <RegistrationOpenModal
          tournament={s.activatingTournament}
          onConfirm={s.handleConfirmActivate}
          onClose={() => s.setActivatingTournament(null)}
        />
      )}
    </div>
  );
}
