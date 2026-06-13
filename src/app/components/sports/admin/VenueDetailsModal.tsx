import React from "react";
import { X, MapPin, Clock, Loader2, Edit2 } from "lucide-react";
import { cn } from "../../ui/utils";
import type { Venue } from "../../../../types/api";

interface VenueDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVenueDetails: Venue | null;
  loadingVenueDetails: boolean;
  onEditVenue?: () => void;
}

export const VenueDetailsModal: React.FC<VenueDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedVenueDetails,
  loadingVenueDetails,
  onEditVenue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl text-left animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Venue Specifications</h2>
              <p className="text-xs text-slate-500 mt-0.5">Details, capacity, courts and contact information</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer text-base"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {loadingVenueDetails ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-sm text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Fetching venue details...</span>
            </div>
          ) : selectedVenueDetails ? (
            <div className="space-y-6">
              {/* Header Details */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">{selectedVenueDetails.name}</h3>
                  {selectedVenueDetails.area || selectedVenueDetails.city ? (
                    <p className="text-xs text-slate-500 mt-1">
                      {[selectedVenueDetails.area, selectedVenueDetails.city].filter(Boolean).join(", ")}
                    </p>
                  ) : null}
                </div>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border",
                  selectedVenueDetails.venueType === "OUTSIDE" 
                    ? "bg-blue-50 text-blue-600 border-blue-200" 
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                )}>
                  {selectedVenueDetails.venueType === "OUTSIDE" ? "Outside Venue" : "Community Venue"}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs leading-relaxed">
                {/* Location Details */}
                <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Location Details</span>
                  <p className="text-slate-700 font-medium">
                    {selectedVenueDetails.address || "No address provided"}
                  </p>
                  {selectedVenueDetails.pinCode && (
                    <p className="text-slate-500 font-mono">PIN: {selectedVenueDetails.pinCode}</p>
                  )}
                  {selectedVenueDetails.mapLink && (
                    <a 
                      href={selectedVenueDetails.mapLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors mt-2 font-semibold hover:underline cursor-pointer"
                    >
                      Open in Maps ↗
                    </a>
                  )}
                </div>

                {/* Capacity & Timings */}
                <div className="space-y-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Capacity</span>
                    <p className="text-slate-700 font-semibold text-sm">
                      {selectedVenueDetails.capacity ? `${selectedVenueDetails.capacity} People` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Operating Hours</span>
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {selectedVenueDetails.openingTime || "N/A"} - {selectedVenueDetails.closingTime || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Person Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Contact Person</span>
                {selectedVenueDetails.contactName ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-left">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Name</span>
                      <p className="text-slate-800 font-semibold mt-0.5">{selectedVenueDetails.contactName}</p>
                    </div>
                    {selectedVenueDetails.contactNumber && (
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Phone</span>
                        <p className="text-slate-600 mt-0.5 font-mono">{selectedVenueDetails.contactNumber}</p>
                      </div>
                    )}
                    {selectedVenueDetails.contactEmail && (
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Email</span>
                        <p className="text-slate-600 mt-0.5 truncate font-mono">{selectedVenueDetails.contactEmail}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">No contact specified</p>
                )}
              </div>

              {/* Courts Available */}
              {selectedVenueDetails.courts && selectedVenueDetails.courts.length > 0 && (
                <div className="border-t border-slate-200 pt-4">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-2">Courts Available ({selectedVenueDetails.courts.length})</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedVenueDetails.courts.map((court, i) => (
                      <span 
                        key={court.id || i} 
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm"
                      >
                        <span 
                          className="w-2.5 h-2.5 rounded-full inline-block mr-2 shadow-sm" 
                          style={{ backgroundColor: court.color || "#4f46e5" }} 
                        />
                        {court.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-red-500 font-medium">
              Failed to load venue details. Please select another venue.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0 rounded-b-2xl">
          {selectedVenueDetails && onEditVenue ? (
            <button
              type="button"
              onClick={() => {
                onEditVenue();
                onClose();
              }}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Venue
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer border-none"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              boxShadow: "0 2px 10px rgba(99,102,241,0.3)"
            }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
