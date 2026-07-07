import { Loader2, X } from "lucide-react";
import { ClipboardList } from "lucide-react";

interface ImportPlayersModalProps {
  showImportModal: boolean;
  setShowImportModal: (v: boolean) => void;
  csvFile: File | null;
  parsedRows: any[];
  parsingError: string | null;
  importing: boolean;
  importProgress: number | null;
  handleDownloadSample: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImportSubmit: () => void;
  setCsvFile: (f: File | null) => void;
  setParsedRows: (r: any[]) => void;
}

export function ImportPlayersModal({
  showImportModal,
  setShowImportModal,
  csvFile,
  parsedRows,
  parsingError,
  importing,
  importProgress,
  handleDownloadSample,
  handleFileChange,
  handleImportSubmit,
  setCsvFile,
  setParsedRows,
}: ImportPlayersModalProps) {
  if (!showImportModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#2a3a5c] pb-3">
          <h3 className="text-lg font-bold text-[#f1f5f9] flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#10b981]" /> Import Participants
          </h3>
          <button
            type="button"
            onClick={() => {
              if (!importing) {
                setShowImportModal(false);
                setCsvFile(null);
                setParsedRows([]);
              }
            }}
            className="p-1.5 hover:bg-[#1e293b] rounded text-[#64748b] hover:text-[#cbd5e1] transition-colors border-none bg-transparent cursor-pointer"
            disabled={importing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0c1220] border border-[#2a3a5c] rounded-lg p-3">
            <div className="text-xs text-[#94a3b8]">
              Download the official formatting template:
            </div>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-2.5 py-1.5 bg-[#f97316]/10 hover:bg-[#f97316]/20 border border-[#f97316]/30 text-[#f97316] text-xs font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              Download Template
            </button>
          </div>

          <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#2a3a5c] hover:border-[#10b981] rounded-xl p-6 bg-[#0c1220]/50 transition-colors relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <ClipboardList className="w-8 h-8 text-[#94a3b8] mb-2" />
            <span className="text-xs font-medium text-[#f1f5f9]">
              {csvFile ? csvFile.name : "Choose CSV File or Drag & Drop"}
            </span>
            <span className="text-[10px] text-[#64748b] mt-1">
              Supports .csv extension up to 5MB
            </span>
          </div>

          {parsingError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg">
              {parsingError}
            </div>
          )}

          {parsedRows.length > 0 && !parsingError && (
            <div className="text-xs text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg p-3 flex items-center justify-between">
              <span>Roster verified successfully:</span>
              <span className="font-bold">{parsedRows.length} player(s) found</span>
            </div>
          )}

          {importing && importProgress !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                <span>Registering players sequentially...</span>
                <span className="font-bold text-[#f97316]">{importProgress}%</span>
              </div>
              <div className="w-full bg-[#0c1220] rounded-full h-2 border border-[#2a3a5c]">
                <div
                  className="bg-gradient-to-r from-[#f97316] to-[#10b981] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={importing}
              onClick={() => {
                setShowImportModal(false);
                setCsvFile(null);
                setParsedRows([]);
              }}
              className="flex-1 py-2.5 bg-transparent border border-[#2a3a5c] text-[#94a3b8] text-sm font-medium rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] cursor-pointer transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={importing || parsedRows.length === 0}
              className="flex-[2] py-2.5 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 disabled:hover:bg-[#10b981] text-white text-sm font-medium rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              {importing ? <><Loader2 className="w-4 h-4 animate-spin" />Importing...</> : "Start Import ↗"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
