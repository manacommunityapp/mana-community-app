import React, { useState, useEffect } from "react";
import { anprService } from "../../../services/parking/anprService";
import type { AnprGateEventResponse, PageResponse } from "../../../services/parking/anprService";
import { Search, Car, ChevronLeft, ChevronRight, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";

export const AnprAuditLog: React.FC = () => {
  const [data, setData] = useState<PageResponse<AnprGateEventResponse> | null>(null);
  const [page, setPage] = useState<number>(0);
  const [selectedGate, setSelectedGate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [searchPlateInput, setSearchPlateInput] = useState<string>("");
  
  // Plate history modal
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [selectedPlate, setSelectedPlate] = useState<string>("");
  const [plateHistory, setPlateHistory] = useState<AnprGateEventResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await anprService.getEvents(selectedGate || undefined, page, 25);
      setData(res);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, selectedGate]);

  const openPlateHistory = async (plate: string) => {
    if (!plate) return;
    setSelectedPlate(plate);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const logs = await anprService.getPlateHistory(plate);
      setPlateHistory(logs);
    } catch (err) {
      console.error("Failed to load plate history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const renderBadge = (action: string) => {
    switch (action) {
      case "OPEN":
        return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">OPEN</Badge>;
      case "HOLD":
        return <Badge className="bg-amber-500 text-white hover:bg-amber-600">HOLD</Badge>;
      case "DENY":
        return <Badge className="bg-rose-500 text-white hover:bg-rose-600">DENY</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Lookup Plate History..."
                value={searchPlateInput}
                onChange={(e) => setSearchPlateInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchPlateInput) {
                    openPlateHistory(searchPlateInput);
                  }
                }}
                className="pl-9"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => searchPlateInput && openPlateHistory(searchPlateInput)}
            >
              Search
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={selectedGate}
              onChange={(e) => {
                setSelectedGate(e.target.value);
                setPage(0);
              }}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-slate-700 dark:text-slate-300"
            >
              <option value="">All Gates</option>
              <option value="GATE_MAIN_IN">Main Gate IN</option>
              <option value="GATE_MAIN_OUT">Main Gate OUT</option>
              <option value="GATE_BASEMENT">Basement Gate</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold">ANPR Vehicle Entry/Exit Audit Log</CardTitle>
          <CardDescription className="text-xs">
            Complete record of automated license plate recognition events at all barrier checkpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-xs font-semibold">
                <TableHead>Timestamp</TableHead>
                <TableHead>Gate & Direction</TableHead>
                <TableHead>Recognised Plate</TableHead>
                <TableHead>AI Confidence</TableHead>
                <TableHead>Matched Entity</TableHead>
                <TableHead>Barrier Action</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    Loading records...
                  </TableCell>
                </TableRow>
              ) : !data?.content || data.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    No gate events found for the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                data.content.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      {new Date(row.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold">{row.gateId}</div>
                      <Badge variant="outline" className="text-[10px] mt-0.5">
                        {row.direction}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => row.plateNumber && openPlateHistory(row.plateNumber)}
                        className="font-mono font-bold text-sm bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        {row.plateNumber || "UNREADABLE"}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.confidence ? `${(row.confidence * 100).toFixed(0)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.matchedResidentName ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {row.matchedResidentName}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unmatched / Guest</span>
                      )}
                    </TableCell>
                    <TableCell>{renderBadge(row.barrierAction)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => row.plateNumber && openPlateHistory(row.plateNumber)}
                        className="h-7 text-xs text-primary hover:text-primary"
                      >
                        <History className="w-3.5 h-3.5 mr-1" /> History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <div>
                Page {page + 1} of {data.totalPages} ({data.totalElements} records)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="h-8"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="h-8"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plate History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono">
              <Car className="w-5 h-5 text-primary" />
              Vehicle Passage History: {selectedPlate}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete chronological audit trail for this vehicle across all gates.
            </DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="py-8 text-center text-slate-400">Loading vehicle history...</div>
          ) : plateHistory.length === 0 ? (
            <div className="py-8 text-center text-slate-400">No recorded passage events for {selectedPlate}.</div>
          ) : (
            <div className="space-y-3 mt-2">
              {plateHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.gateId} — {item.direction}
                    </div>
                    <div className="text-slate-400 font-mono mt-0.5">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                    {item.matchedResidentName && (
                      <div className="text-emerald-600 font-medium mt-1">
                        Resident: {item.matchedResidentName}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    {renderBadge(item.barrierAction)}
                    <div className="text-[11px] text-slate-400 block">
                      AI Conf: {item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};