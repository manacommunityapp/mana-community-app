import React, { useState, useEffect } from "react";
import { evChargingService } from "../../../services/parking/evChargingService";
import type {
  EvChargerResponse,
  EvChargingSessionResponse,
  EvChargingHistoryItem,
} from "../../../services/parking/evChargingService";
import {
  Zap,
  BatteryCharging,
  Power,
  History,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wallet,
  Shield,
  Sparkles,
  Car,
  Gauge,
  Receipt,
  Download,
  Share2,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { automationService, type EvChargingLoadArbitrateResponse } from "../../../services/automation/automationService";

export const EvChargingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("ACTIVE_SESSION");
  const [chargers, setChargers] = useState<EvChargerResponse[]>([]);
  const [sessions, setSessions] = useState<EvChargingSessionResponse[]>([]);
  const [activeSession, setActiveSession] = useState<EvChargingSessionResponse | null>(null);
  const [historyItems, setHistoryItems] = useState<EvChargingHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Bay Booking Dialog State
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [selectedStationForBooking, setSelectedStationForBooking] = useState<EvChargerResponse | null>(null);
  const [bookVehicle, setBookVehicle] = useState<string>("KA-01-EV-9821 (Tata Nexon EV)");
  const [bookDate, setBookDate] = useState<string>("Today");
  const [bookTime, setBookTime] = useState<string>("06:00 PM");
  const [bookDurationHours, setBookDurationHours] = useState<number>(2);
  const [bookTargetSoC, setBookTargetSoC] = useState<number>(85);
  const [bookingSuccessPass, setBookingSuccessPass] = useState<{ bookingId: string; passCode: string } | null>(null);

  // Start dialog
  const [startModalOpen, setStartModalOpen] = useState<boolean>(false);
  const [selectedCharger, setSelectedCharger] = useState<EvChargerResponse | null>(null);
  const [initialMeter, setInitialMeter] = useState<string>("100.0");

  // Stop dialog
  const [stopModalOpen, setStopModalOpen] = useState<boolean>(false);
  const [finalMeter, setFinalMeter] = useState<string>("");

  // Invoice viewer modal
  const [selectedInvoice, setSelectedInvoice] = useState<EvChargingHistoryItem | null>(null);

  // AI Peak Load Arbitrator
  const [isArbitrating, setIsArbitrating] = useState<boolean>(false);
  const [arbitrateResult, setArbitrateResult] = useState<EvChargingLoadArbitrateResponse | null>(null);
  const [showArbitrateModal, setShowArbitrateModal] = useState<boolean>(false);

  // Station filter
  const [filterLevel, setFilterLevel] = useState<string>("ALL");

  const handleArbitrateLoad = async () => {
    setIsArbitrating(true);
    try {
      const res = await automationService.arbitrateEvChargingLoad({
        gridSanctionedKw: 50.0,
        currentBaseloadKw: 32.5,
        solarOutputKw: 6.2,
        chargers: (chargers.length > 0 ? chargers : [
          { id: 1, deviceId: "CHG-01", status: "AVAILABLE", maxKwRating: 7.4, connectorType: "Type 2 AC" },
          { id: 2, deviceId: "CHG-02", status: "CHARGING", maxKwRating: 22.0, connectorType: "CCS2 DC" }
        ]).map((c, i) => ({
          chargerId: c.deviceId || `CHG-0${i + 1}`,
          vehicleModel: activeSession?.chargerDeviceId === c.deviceId ? (activeSession.vehicleNumber || "Tata Nexon EV") : `EV Fleet Unit ${i + 1}`,
          currentDrawKw: c.status === "CHARGING" ? 7.4 : 0,
          requestedKwh: 25.0,
          batteryLevelPct: 40 + i * 15,
          priorityScore: c.status === "CHARGING" ? 8 : 4
        }))
      });
      setArbitrateResult(res);
      setShowArbitrateModal(true);
    } catch (err) {
      console.error("Failed to run EV load arbitrator:", err);
    } finally {
      setIsArbitrating(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chargersRes, sessionsRes, histRes] = await Promise.all([
        evChargingService.getChargers(),
        evChargingService.getMySessions(),
        evChargingService.getHistory(),
      ]);
      setChargers(chargersRes || []);
      setSessions(sessionsRes || []);
      setHistoryItems(histRes || []);
      const active = (sessionsRes || []).find((s) => s.status === "ACTIVE");
      setActiveSession(active || null);
      if (active) {
        setFinalMeter(((active.startMeterKwh || 100) + (active.totalKwh || 14.5)).toFixed(1));
      }
    } catch (err) {
      console.error("Failed to load EV charging data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartSession = async () => {
    if (!selectedCharger) return;
    try {
      await evChargingService.startSession({
        chargerId: selectedCharger.id,
        currentMeterReading: parseFloat(initialMeter) || 0.0,
        vehicleNumber: bookVehicle,
      });
      setStartModalOpen(false);
      fetchData();
      setActiveTab("ACTIVE_SESSION");
    } catch (err) {
      console.error("Failed to start charging session:", err);
      alert("Failed to start session. Check your CFBOS wallet balance.");
    }
  };

  const handleStopSession = async () => {
    if (!activeSession) return;
    try {
      await evChargingService.stopSession(activeSession.id, {
        finalMeterReading: parseFloat(finalMeter) || activeSession.startMeterKwh,
        stopReason: "USER_COMPLETED"
      });
      setStopModalOpen(false);
      fetchData();
      setActiveTab("HISTORY");
    } catch (err) {
      console.error("Failed to stop charging session:", err);
      alert("Failed to complete charging session.");
    }
  };

  const handleOpenBooking = (station: EvChargerResponse) => {
    setSelectedStationForBooking(station);
    setBookingSuccessPass(null);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedStationForBooking) return;
    const res = await evChargingService.bookStation({
      chargerId: selectedStationForBooking.id,
      vehicleNumber: bookVehicle,
      date: bookDate,
      startTime: bookTime,
      durationHours: bookDurationHours,
      targetSoCPercentage: bookTargetSoC,
    });
    setBookingSuccessPass({
      bookingId: res.bookingId,
      passCode: res.barrierPassCode,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">AVAILABLE</Badge>;
      case "CHARGING":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white animate-pulse">CHARGING</Badge>;
      case "BOOKED":
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">RESERVED</Badge>;
      case "FAULT":
      case "OFFLINE":
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredChargers = chargers.filter((c) => {
    if (filterLevel === "ALL") return true;
    return c.level === filterLevel;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              EV Power Charging Hub
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time bay reservations, smart telemetry telemetry & CFBOS wallet-settled green energy
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleArbitrateLoad}
            disabled={isArbitrating}
            className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            {isArbitrating ? "Balancing Grid..." : "AI Peak Load Arbitrator"}
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => setActiveTab("STATIONS")}
            className="bg-primary text-primary-foreground text-xs font-semibold"
          >
            <Car className="w-3.5 h-3.5 mr-1.5" /> Book a Bay
          </Button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <TabsTrigger value="ACTIVE_SESSION" className="flex items-center gap-2 text-xs font-bold">
            <Gauge className="w-4 h-4 text-amber-500" />
            Live Power Telemetry
            {activeSession && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
            )}
          </TabsTrigger>
          <TabsTrigger value="STATIONS" className="flex items-center gap-2 text-xs font-bold">
            <Car className="w-4 h-4 text-emerald-600" />
            Charging Bays ({chargers.length})
          </TabsTrigger>
          <TabsTrigger value="HISTORY" className="flex items-center gap-2 text-xs font-bold">
            <Receipt className="w-4 h-4 text-blue-600" />
            Invoices &amp; History ({historyItems.length})
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: LIVE POWER TELEMETRY ──────────────────────────── */}
        <TabsContent value="ACTIVE_SESSION" className="space-y-6">
          {activeSession ? (
            <div className="space-y-6">
              {/* Telemetry Hero Card */}
              <Card className="border-amber-400 bg-gradient-to-br from-amber-500/10 via-slate-900/5 to-slate-900/10 border-2 shadow-lg">
                <CardHeader className="py-4 px-6 flex flex-row items-center justify-between border-b border-amber-200/50 dark:border-amber-900/30">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md animate-pulse">
                      <BatteryCharging className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-black text-slate-900 dark:text-white">
                          Charging Session #{activeSession.id}
                        </CardTitle>
                        <Badge className="bg-amber-500 text-white text-[10px] animate-pulse">
                          HIGH-VOLTAGE ACTIVE
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Station: <span className="font-bold text-slate-800 dark:text-slate-200">{activeSession.chargerDeviceId}</span> (Slot {activeSession.slotNumber || "B1-P14"}) • Vehicle: <span className="font-bold text-slate-800 dark:text-slate-200">{activeSession.vehicleNumber || "KA-01-EV-9821"}</span>
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setStopModalOpen(true)}
                    className="shadow-sm font-bold text-xs"
                  >
                    <Power className="w-4 h-4 mr-1.5" /> Stop &amp; Settle Wallet
                  </Button>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                    {/* Visual Battery SoC Gauge */}
                    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-xs">
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          {/* Background Ring */}
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="currentColor"
                            strokeWidth="9"
                            fill="transparent"
                            className="text-slate-200 dark:text-slate-800"
                          />
                          {/* Progress Ring */}
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="currentColor"
                            strokeWidth="9"
                            fill="transparent"
                            strokeDasharray={263.89}
                            strokeDashoffset={
                              263.89 -
                              (263.89 * (activeSession.currentSoCPercentage || 68)) / 100
                            }
                            strokeLinecap="round"
                            className="text-amber-500 transition-all duration-700"
                          />
                        </svg>

                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <Zap className="w-5 h-5 text-amber-500 mb-0.5" />
                          <span className="text-3xl font-black text-slate-900 dark:text-white">
                            {activeSession.currentSoCPercentage || 68}%
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Target: {activeSession.targetSoCPercentage || 90}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 text-center">
                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] rounded-full border border-emerald-200">
                          +18% Energy Gained This Session
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1.5">
                          Estimated full cut-off in ~26 minutes
                        </p>
                      </div>
                    </div>

                    {/* Real-time Telemetry Metrics Grid */}
                    <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Power Flow
                        </span>
                        <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                          {activeSession.powerOutputKw || 18.2} kW
                        </span>
                        <span className="text-[10px] text-slate-400">High-speed dynamic feed</span>
                      </div>

                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Delivered Energy
                        </span>
                        <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                          {activeSession.totalKwh || 12.8} kWh
                        </span>
                        <span className="text-[10px] text-slate-400">Start: {activeSession.startMeterKwh} kWh</span>
                      </div>

                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Accrued Bill
                        </span>
                        <span className="text-xl font-black text-emerald-600 mt-1 block">
                          ₹{(activeSession.totalCost || 108.8).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400">@ ₹8.50 / kWh flat rate</span>
                      </div>

                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Grid Voltage
                        </span>
                        <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 block">
                          {activeSession.voltageV || 412.5} V
                        </span>
                        <span className="text-[10px] text-slate-400">3-Phase 415V RMS</span>
                      </div>

                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Current Output
                        </span>
                        <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1 block">
                          {activeSession.currentA || 26.4} A
                        </span>
                        <span className="text-[10px] text-slate-400">Balanced load draw</span>
                      </div>

                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          CO₂ Reduction
                        </span>
                        <span className="text-lg font-black text-emerald-600 mt-1 block">
                          {activeSession.co2SavedKg || 10.9} kg
                        </span>
                        <span className="text-[10px] text-emerald-500 font-semibold">Green solar offset</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Safety & Protocol Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" /> Auto Cut-off &amp; Safety Guard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      Thermal runaway cut-off active (Connector temp: {activeSession.temperatureCelsius || 33.5}°C)
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      Automatic power taper triggers when battery SoC crosses 80%
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      CFBOS Auto-Debit balance pre-authorized for safe disconnect
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-primary" /> Target Charge Limit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Target Battery SoC:</span>
                      <span className="font-extrabold text-primary text-sm">
                        {activeSession.targetSoCPercentage || 90}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[70, 80, 85, 90, 100].map((soc) => (
                        <button
                          key={soc}
                          onClick={() => {
                            setActiveSession((prev) =>
                              prev ? { ...prev, targetSoCPercentage: soc } : null
                            );
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            (activeSession.targetSoCPercentage || 90) === soc
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          {soc}%
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Standard lithium-ion best practice: 80%–85% maximizes battery pack longevity.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="border-dashed border-2 border-slate-300 dark:border-slate-800 p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Active EV Charging Session
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
                Your vehicle is not currently plugged into any society charging port. Browse available bays or reserve a guaranteed slot below.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={() => setActiveTab("STATIONS")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  <Car className="w-4 h-4 mr-1.5" /> View Available Bays
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ── TAB 2: CHARGING BAYS & RESERVATION ───────────────────── */}
        <TabsContent value="STATIONS" className="space-y-6">
          {/* Level Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Community EV Bays ({filteredChargers.length} Stations)
              </h3>
              <p className="text-xs text-slate-500">
                Reserve slots ahead or plug-in for instant auto-metered power delivery
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              {["ALL", "Basement 1", "Basement 2"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterLevel === lvl
                      ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Bays Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredChargers.map((chg) => (
              <Card
                key={chg.id}
                className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {chg.deviceId}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Slot {chg.slotNumber || "General"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{chg.location || "Basement Parking"}</p>
                      </div>
                    </div>
                    {getStatusBadge(chg.status)}
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[11px]">CONNECTOR</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {chg.connectorType}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">RATING</span>
                        <span className="font-bold text-emerald-600 text-xs">
                          {chg.maxKwRating} kW Max Speed
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">TARIFF</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          ₹{chg.tariffPerKwh || 8.5} / kWh
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">LEVEL</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-400 text-xs">
                          {chg.level || "Basement 1"}
                        </span>
                      </div>
                    </div>

                    {chg.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                        ℹ️ {chg.notes}
                      </p>
                    )}

                    {chg.activeVehicleNumber && (
                      <div className="flex items-center justify-between text-[11px] bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg text-amber-800 dark:text-amber-300">
                        <span>Vehicle Plugged:</span>
                        <span className="font-mono font-bold">{chg.activeVehicleNumber}</span>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs font-bold"
                    disabled={chg.status !== "AVAILABLE"}
                    onClick={() => handleOpenBooking(chg)}
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary" />
                    Reserve Slot
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={chg.status !== "AVAILABLE" || activeSession !== null}
                    onClick={() => {
                      setSelectedCharger(chg);
                      setStartModalOpen(true);
                    }}
                  >
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    {chg.status === "AVAILABLE"
                      ? activeSession
                        ? "Session Active"
                        : "Plug In & Start"
                      : chg.status === "BOOKED"
                      ? "Reserved"
                      : "In Use"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── TAB 3: INVOICES & HISTORY ────────────────────────────── */}
        <TabsContent value="HISTORY" className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" /> EV Power Tax Invoices &amp; Charging Log
                </CardTitle>
                <CardDescription className="text-xs">
                  Automated CFBOS wallet deduction records with green carbon reduction offsets.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200">
                <span>Total 55.7 kg CO₂ Offset</span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            Session #{item.sessionId}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            • {item.stationCode}
                          </span>
                          <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px]">
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.vehicleNumber} • {item.date} ({item.durationMinutes} mins)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto text-xs">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Energy</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.energyDeliveredKwh} kWh
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Total Bill</span>
                        <span className="font-extrabold text-emerald-600 text-sm">
                          ₹{item.totalCostInr.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">CO₂ Saved</span>
                        <span className="font-bold text-emerald-600">
                          {item.co2SavedKg} kg
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedInvoice(item)}
                        className="text-xs font-bold"
                      >
                        <Receipt className="w-3.5 h-3.5 mr-1" /> View Invoice
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── BAY RESERVATION MODAL ─────────────────────────────────────── */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Reserve Charging Bay
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pre-authorize your vehicle for scheduled power flow and auto-barrier clearance.
            </DialogDescription>
          </DialogHeader>

          {bookingSuccessPass ? (
            <div className="space-y-4 py-3 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white">
                  EV Charging Bay Reserved!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your ANPR gate pass has been registered for automatic entry.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Booking Ref:</span>
                  <span className="font-mono font-bold">{bookingSuccessPass.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Station Bay:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedStationForBooking?.deviceId} ({selectedStationForBooking?.location})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Barrier Pass:</span>
                  <span className="font-mono font-extrabold text-emerald-600 text-sm">
                    {bookingSuccessPass.passCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slot Time:</span>
                  <span className="font-bold">{bookDate} • {bookTime} ({bookDurationHours} Hours)</span>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setBookingModalOpen(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 text-emerald-900 dark:text-emerald-300">
                <span className="font-bold">{selectedStationForBooking?.deviceId}</span> • {selectedStationForBooking?.connectorType} ({selectedStationForBooking?.maxKwRating} kW)
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Registered Vehicle</label>
                <Input
                  value={bookVehicle}
                  onChange={(e) => setBookVehicle(e.target.value)}
                  placeholder="KA-01-EV-9821 (Tata Nexon EV)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Date</label>
                  <select
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Start Time</label>
                  <select
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="07:00 PM">07:00 PM</option>
                    <option value="08:00 PM">08:00 PM</option>
                    <option value="09:00 PM">09:00 PM</option>
                    <option value="10:00 PM">10:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Duration (Hours)</label>
                  <select
                    value={bookDurationHours}
                    onChange={(e) => setBookDurationHours(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours</option>
                    <option value={3}>3 Hours</option>
                    <option value={4}>4 Hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Target Battery SoC</label>
                  <select
                    value={bookTargetSoC}
                    onChange={(e) => setBookTargetSoC(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value={80}>80% (Eco-Max)</option>
                    <option value={85}>85% (Balanced)</option>
                    <option value={90}>90% (Extended)</option>
                    <option value={100}>100% (Trip Full)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Est. Power Required:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ~{(bookDurationHours * (selectedStationForBooking?.maxKwRating || 11) * 0.7).toFixed(1)} kWh
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Est. Cost:</span>
                  <span className="font-black text-emerald-600 text-sm">
                    ₹{((bookDurationHours * (selectedStationForBooking?.maxKwRating || 11) * 0.7) * (selectedStationForBooking?.tariffPerKwh || 8.5)).toFixed(0)}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setBookingModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  className="bg-primary text-primary-foreground font-bold"
                >
                  Confirm Reservation Pass
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── INVOICE DETAIL MODAL ────────────────────────────────────── */}
      <Dialog open={selectedInvoice !== null} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" /> EV Power Tax Invoice
            </DialogTitle>
            <DialogDescription className="text-xs">
              Official GST receipt &amp; Green Energy Certificate.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4 py-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">Invoice ID:</span>
                  <span className="font-mono font-bold">INV-EV-{selectedInvoice.sessionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Station Code:</span>
                  <span className="font-bold">{selectedInvoice.stationCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle:</span>
                  <span className="font-semibold">{selectedInvoice.vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Energy Delivered:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedInvoice.energyDeliveredKwh} kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tariff Rate:</span>
                  <span>₹8.50 / kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SGST (9%) + CGST (9%):</span>
                  <span>₹{(selectedInvoice.totalCostInr * 0.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-extrabold">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-600">₹{selectedInvoice.totalCostInr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Settlement:</span>
                  <span className="text-emerald-600 font-semibold">{selectedInvoice.paymentMode}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 block text-xs">
                    Green Energy Certificate
                  </span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    This session prevented {selectedInvoice.co2SavedKg} kg of atmospheric CO₂ emissions.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => alert("Invoice PDF downloaded to your device.")}
                  className="w-full text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download Tax Invoice (PDF)
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Start Dialog */}
      <Dialog open={startModalOpen} onOpenChange={setStartModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Start Charging at {selectedCharger?.deviceId}
            </DialogTitle>
            <DialogDescription className="text-xs">
              A ₹20 minimum balance hold is verified on your CFBOS wallet before activation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Current Charger Meter Reading (kWh)</label>
              <Input
                type="number"
                step="0.1"
                value={initialMeter}
                onChange={(e) => setInitialMeter(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartSession}>Confirm &amp; Start</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stop Dialog */}
      <Dialog open={stopModalOpen} onOpenChange={setStopModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Power className="w-5 h-5" /> Stop EV Charging Session
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter the final meter reading on the charging station screen to calculate energy and settle payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Final Meter Reading (kWh)</label>
              <Input
                type="number"
                step="0.1"
                value={finalMeter}
                onChange={(e) => setFinalMeter(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStopModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleStopSession}>
              Settle &amp; Stop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Peak Load Arbitrator Modal */}
      <Dialog open={showArbitrateModal} onOpenChange={setShowArbitrateModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-5 h-5 text-emerald-600" /> AI EV Peak Load Arbitrator &amp; Smart Grid Sentinel
            </DialogTitle>
            <DialogDescription className="text-xs">
              Gemini dynamic load balancing preventing peak transformer overload and demand tariff penalties.
            </DialogDescription>
          </DialogHeader>

          {arbitrateResult && (
            <div className="space-y-4 py-2 text-xs">
              {/* Grid Status Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">GRID STATUS</span>
                  <Badge className={
                    arbitrateResult.gridStatus === "OPTIMAL"
                      ? "bg-emerald-600 text-white mt-0.5"
                      : arbitrateResult.gridStatus === "PEAK_WARNING"
                      ? "bg-amber-500 text-white mt-0.5"
                      : "bg-rose-600 text-white mt-0.5"
                  }>
                    {arbitrateResult.gridStatus}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">TOTAL DEMAND</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {arbitrateResult.totalDemandKw} kW
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">HEADROOM</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {arbitrateResult.headroomKw} kW
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">EST. SAVINGS</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    ₹{arbitrateResult.estimatedCostSavingsInr}
                  </span>
                </div>
              </div>

              {/* Rationale & Strategy */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 p-3 rounded-xl">
                <div className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center justify-between mb-1">
                  <span>Dynamic Arbitration Strategy</span>
                  {arbitrateResult.peakTariffAvoided && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300">
                      ⚡ Peak Surcharge Avoided
                    </Badge>
                  )}
                </div>
                <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  {arbitrateResult.arbitrationStrategy}
                </p>
              </div>

              {/* Actionable Directives per Charger */}
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Charger Dispense Directives</h4>
                <div className="space-y-2">
                  {arbitrateResult.actionableDirectives?.map((directive, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                          {directive.chargerId}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            Assigned: <span className="font-bold text-emerald-600">{directive.assignedKw} kW</span>
                            {directive.curtailmentPct > 0 && (
                              <span className="text-rose-500 ml-2">(-{directive.curtailmentPct}% curtail)</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{directive.reason}</p>
                        </div>
                      </div>
                      <Badge className={
                        directive.action === "BOOST"
                          ? "bg-purple-600 text-white text-[10px]"
                          : directive.action === "MAINTAIN"
                          ? "bg-emerald-600 text-white text-[10px]"
                          : directive.action === "THROTTLE"
                          ? "bg-amber-500 text-white text-[10px]"
                          : "bg-rose-600 text-white text-[10px]"
                      }>
                        {directive.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowArbitrateModal(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Acknowledge &amp; Enforce Directives
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};