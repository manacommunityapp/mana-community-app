import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  iotService,
  type IoTSensor,
  type SensorAnomaly,
  type DailyAggregate,
} from "../../../services/iotService";

const SENSOR_TYPES = ["All", "WATER", "ELECTRICITY", "ENVIRONMENT", "GENERATOR"] as const;
type SensorType = (typeof SENSOR_TYPES)[number];

const TYPE_EMOJI: Record<string, string> = {
  WATER: "💧",
  ELECTRICITY: "⚡",
  ENVIRONMENT: "🌡️",
  GENERATOR: "🔋",
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-50 border-red-300 text-red-800",
  HIGH: "bg-orange-50 border-orange-300 text-orange-800",
  MEDIUM: "bg-amber-50 border-amber-300 text-amber-800",
  LOW: "bg-yellow-50 border-yellow-300 text-yellow-800",
};

function SensorCard({
  sensor,
  onRefresh,
}: {
  sensor: IoTSensor;
  onRefresh: (id: number, val: number) => void;
}) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const val = await iotService.pollSensor(sensor.id);
      onRefresh(sensor.id, val);
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  };

  const ageMin = sensor.lastReadingAt
    ? Math.round((Date.now() - new Date(sensor.lastReadingAt).getTime()) / 60000)
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-lg">{TYPE_EMOJI[sensor.sensorType] ?? "📡"}</span>
          <span className="ml-2 text-sm font-semibold text-gray-800">{sensor.sensorName}</span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            sensor.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {sensor.isActive ? "Online" : "Offline"}
        </span>
      </div>

      <p className="text-xs text-gray-500">{sensor.location}</p>

      <div className="flex items-end gap-2 mt-1">
        <span className="text-2xl font-bold text-gray-900">
          {sensor.lastReading != null ? sensor.lastReading.toFixed(1) : "—"}
        </span>
        {sensor.unit && <span className="text-sm text-gray-500 mb-0.5">{sensor.unit}</span>}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{ageMin != null ? `${ageMin}m ago` : "No reading"}</span>
        <button
          onClick={handleRefresh}
          disabled={refreshing || !sensor.isActive}
          className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </div>
  );
}

function MiniChart({ aggregates }: { aggregates: DailyAggregate[] }) {
  if (aggregates.length < 2) {
    return <p className="text-xs text-gray-400 py-4 text-center">Not enough data</p>;
  }
  const vals = aggregates.map((a) => a.avg);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const range = max - min || 1;
  const W = 500;
  const H = 80;
  const pts = aggregates.map((_, i) => {
    const x = (i / (aggregates.length - 1)) * W;
    const y = H - ((vals[i] - min) / range) * (H - 10) - 5;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {aggregates.map((a, i) => {
        const x = (i / (aggregates.length - 1)) * W;
        const y = H - ((vals[i] - min) / range) * (H - 10) - 5;
        return <circle key={i} cx={x} cy={y} r={3} fill="#3B82F6" />;
      })}
    </svg>
  );
}

export default function IoTSensorDashboard() {
  const { user } = useAuth();
  const communityId = user?.communityId ?? 1;

  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [anomalies, setAnomalies] = useState<SensorAnomaly[]>([]);
  const [typeFilter, setTypeFilter] = useState<SensorType>("All");
  const [selectedSensor, setSelectedSensor] = useState<IoTSensor | null>(null);
  const [aggregates, setAggregates] = useState<DailyAggregate[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      iotService.getSensors(communityId),
      iotService.getActiveAnomalies(communityId),
    ])
      .then(([s, a]) => {
        setSensors(s);
        setAnomalies(a);
        if (s.length > 0 && !selectedSensor) setSelectedSensor(s[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [communityId, selectedSensor]);

  useEffect(() => { load(); }, [communityId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectSensor = async (s: IoTSensor) => {
    setSelectedSensor(s);
    setChartLoading(true);
    try {
      const agg = await iotService.getAggregates(s.id, 7);
      setAggregates(agg);
    } catch {
      setAggregates([]);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSensor) handleSelectSensor(selectedSensor);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefreshReading = (id: number, val: number) => {
    setSensors((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, lastReading: val, lastReadingAt: new Date().toISOString() } : s
      )
    );
  };

  const handleResolveAnomaly = async (id: number) => {
    try {
      await iotService.resolveAnomaly(id);
      setAnomalies((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silent
    }
  };

  const filteredSensors = sensors.filter(
    (s) => typeFilter === "All" || s.sensorType === typeFilter
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">IoT Sensor Dashboard</h1>
        <span className="text-xs text-gray-400">{sensors.length} sensors</span>
      </div>

      {/* Active anomalies banner */}
      {anomalies.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800">
            ⚠️ {anomalies.length} Active Anomal{anomalies.length === 1 ? "y" : "ies"}
          </p>
          {anomalies.map((a) => (
            <div
              key={a.id}
              className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 ${
                SEVERITY_COLORS[a.severity] ?? "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">
                  {a.sensorName ?? `Sensor #${a.sensorId}`} — {a.eventType}
                </p>
                <p className="text-xs opacity-80 truncate">{a.description}</p>
                <p className="text-xs opacity-60 mt-0.5">
                  {new Date(a.detectedAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => handleResolveAnomaly(a.id)}
                className="text-xs underline opacity-70 hover:opacity-100 shrink-0"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {SENSOR_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              typeFilter === t
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t === "All" ? "All" : `${TYPE_EMOJI[t] ?? ""} ${t}`}
          </button>
        ))}
      </div>

      {/* Sensor grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : filteredSensors.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-16">No sensors found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSensors.map((s) => (
            <div
              key={s.id}
              onClick={() => handleSelectSensor(s)}
              className={`cursor-pointer transition ring-2 rounded-xl ${
                selectedSensor?.id === s.id ? "ring-blue-500" : "ring-transparent"
              }`}
            >
              <SensorCard sensor={s} onRefresh={handleRefreshReading} />
            </div>
          ))}
        </div>
      )}

      {/* Usage chart */}
      {selectedSensor && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">
              7-Day Usage — {selectedSensor.sensorName}
              {selectedSensor.unit && (
                <span className="ml-1 text-gray-400 font-normal">({selectedSensor.unit})</span>
              )}
            </h2>
          </div>
          {chartLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <>
              <MiniChart aggregates={aggregates} />
              {aggregates.length > 0 && (
                <div className="flex gap-6 mt-3 text-xs text-gray-500">
                  {["min", "max", "avg"].map((k) => {
                    const vals = aggregates.map((a) => a[k as keyof DailyAggregate] as number);
                    const overall =
                      k === "min"
                        ? Math.min(...vals)
                        : k === "max"
                        ? Math.max(...vals)
                        : vals.reduce((a, b) => a + b, 0) / vals.length;
                    return (
                      <span key={k}>
                        <span className="font-medium capitalize">{k}</span>:{" "}
                        {overall.toFixed(1)} {selectedSensor.unit}
                      </span>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
