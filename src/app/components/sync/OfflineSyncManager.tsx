import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw,
  CheckCircle,
  Database,
  Smartphone,
  Layers,
  ShieldCheck,
  Send,
  Trash2,
  Inbox
} from "lucide-react";
import {
  offlineSyncService,
  type ClientMutationItem,
  type PushSyncBatchResult,
  type SyncEntityType
} from "../../../services/sync/offlineSyncService";

interface Props {
  userId?: number;
  communityId?: number;
}

export const OfflineSyncManager: React.FC<Props> = ({ userId = 1, communityId = 1 }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingQueue, setPendingQueue] = useState<ClientMutationItem[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<PushSyncBatchResult | null>(null);
  const [lastCheckpoint, setLastCheckpoint] = useState<number>(0);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Simulation form
  const [simType, setSimType] = useState<SyncEntityType>("VISITOR_PASS");
  const [simSummary, setSimSummary] = useState<string>("Courier Guest Entry (Apartment B-402)");

  const deviceId = "device-web-client-01";

  useEffect(() => {
    refreshQueue();

    const handleOnline = () => {
      setIsOnline(true);
      autoSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const refreshQueue = () => {
    setPendingQueue(offlineSyncService.getPendingQueue());
    setLastCheckpoint(offlineSyncService.getLastCheckpoint());
  };

  const autoSync = async () => {
    setSyncing(true);
    try {
      const res = await offlineSyncService.pushBatch(userId, communityId, deviceId);
      if (res) {
        setLastSyncResult(res);
        setNotificationMsg(`Auto-synced ${res.appliedCount} offline mutations to cloud!`);
        setTimeout(() => setNotificationMsg(null), 4000);
      }
      refreshQueue();
    } catch (err) {
      console.error("Auto-sync failed", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      alert("Cannot sync: device is currently offline.");
      return;
    }
    await autoSync();
  };

  const handleSimulateOfflineAction = () => {
    offlineSyncService.enqueueMutation({
      entityType: simType,
      operation: "CREATE",
      payloadJson: JSON.stringify({ summary: simSummary, createdOffline: true }),
    });
    refreshQueue();
    setNotificationMsg(`Queued 1 ${simType} mutation locally into SQLite/IndexedDB queue.`);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleClearQueue = () => {
    offlineSyncService.clearQueue();
    refreshQueue();
  };

  const handleDeleteItem = (id: string) => {
    offlineSyncService.removeQueueItem(id);
    refreshQueue();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Network Header Banner */}
      <div className={`p-6 rounded-2xl shadow-sm border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isOnline
          ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
          : "bg-amber-50 border-amber-200 text-amber-900"
      }`}>
        <div className="flex items-center gap-3.5">
          <span className={`p-3 rounded-xl shadow-sm ${
            isOnline ? "bg-emerald-500 text-white" : "bg-amber-500 text-white animate-pulse"
          }`}>
            {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
          </span>
          <div>
            <div className="flex items-center gap-2 font-bold text-lg">
              <span>{isOnline ? "Online — Cloud Synchronized" : "Offline Mode Active (Basement / Elevator)"}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs uppercase font-extrabold ${
                isOnline ? "bg-emerald-200 text-emerald-800" : "bg-amber-200 text-amber-800"
              }`}>
                {isOnline ? "Connected" : "Local SQLite Cache"}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isOnline
                ? "Mutations sync directly to cloud with delta replication."
                : "Actions are persisted safely in local device storage and will auto-replay when signal is restored."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualSync}
            disabled={syncing || pendingQueue.length === 0 || !isOnline}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50"
          >
            {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            Sync Now ({pendingQueue.length})
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Pending Offline Queue</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5 font-mono">{pendingQueue.length} items</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Server Checkpoint Version</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5 font-mono">v{lastCheckpoint}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Conflict Strategy</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5">LWW Vector Clocks</div>
          </div>
        </div>
      </div>

      {/* Offline Action Simulator Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-600" />
          Simulate Offline Action (Basement B2 / Lift)
        </h2>
        <p className="text-xs text-slate-500">
          Create a test mutation to observe how the client queues records locally while offline.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Entity Type</label>
            <select
              value={simType}
              onChange={(e) => setSimType(e.target.value as SyncEntityType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="VISITOR_PASS">Visitor Gate Pass</option>
              <option value="PARKING_ENTRY">Parking Slot Entry</option>
              <option value="SOS_TRIGGER">Emergency SOS Broadcast</option>
              <option value="EV_SESSION">EV Charging Plug-In</option>
              <option value="HELPDESK_TICKET">Helpdesk Complaint</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Action Summary / Payload</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={simSummary}
                onChange={(e) => setSimSummary(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSimulateOfflineAction}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-4 h-4" />
                Enqueue Offline
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Queue Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Pending Offline Mutation Queue</h3>
            <p className="text-xs text-slate-400 mt-0.5">Stored in local IndexedDB / SQLite storage</p>
          </div>
          {pendingQueue.length > 0 && (
            <button
              onClick={handleClearQueue}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Queue
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-6">Mutation ID</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-6">Local Timestamp</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pendingQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No pending mutations in local queue. All changes are synced with the cloud.
                  </td>
                </tr>
              ) : (
                pendingQueue.map((item) => (
                  <tr key={item.clientMutationId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-xs font-semibold text-slate-800">
                      {item.clientMutationId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
                        {item.entityType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{item.operation}</td>
                    <td className="py-3.5 px-6 text-xs text-slate-500">
                      {new Date(item.clientTimestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteItem(item.clientMutationId)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete from local queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
