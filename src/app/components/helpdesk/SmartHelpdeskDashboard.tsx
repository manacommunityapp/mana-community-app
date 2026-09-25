import { useState, useEffect } from "react";
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Building,
  UserCheck,
  Zap,
  Sparkles,
  Flame,
  ArrowRight,
  Star,
  Layers,
  Send,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  helpdeskSmartService,
  type SmartTicket,
  type TicketPriority,
  type TicketStatus,
  type ClassificationResult,
} from "../../../services/helpdesk/helpdeskSmartService";
import { useAuth } from "../../../contexts/AuthContext";

const PRIORITY_BADGES: Record<TicketPriority, { label: string; className: string }> = {
  EMERGENCY: { label: "EMERGENCY", className: "bg-red-600 text-white animate-pulse" },
  HIGH: { label: "HIGH", className: "bg-orange-600 text-white" },
  MEDIUM: { label: "MEDIUM", className: "bg-amber-500 text-white" },
  LOW: { label: "LOW", className: "bg-slate-500 text-white" },
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800 border-blue-300",
  ASSIGNED: "bg-purple-100 text-purple-800 border-purple-300",
  IN_PROGRESS: "bg-amber-100 text-amber-800 border-amber-300",
  RESOLVED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  CLOSED: "bg-slate-100 text-slate-800 border-slate-300",
  REOPENED: "bg-rose-100 text-rose-800 border-rose-300",
};

export function SmartHelpdeskDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SmartTicket[]>([]);
  const [activeTab, setActiveTab] = useState("my-tickets");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Ticket State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [tower, setTower] = useState(user?.flatNumber ? user.flatNumber.split("-")[0] || "Tower A" : "Tower A");
  const [flatNo, setFlatNo] = useState(user?.flatNumber || "A-1204");
  const [classification, setClassification] = useState<ClassificationResult | null>(null);

  // Detail Modal State
  const [selectedTicket, setSelectedTicket] = useState<SmartTicket | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTickets(helpdeskSmartService.getTickets());
  };

  // Real-time AI classification heuristic on description change
  useEffect(() => {
    if (ticketDesc.trim().length > 5) {
      const res = helpdeskSmartService.classifyTicket(ticketDesc);
      setClassification(res);
    } else {
      setClassification(null);
    }
  }, [ticketDesc]);

  const handleCreateTicket = () => {
    if (!ticketTitle.trim() || !ticketDesc.trim()) return;
    const priority = classification?.priority || "MEDIUM";
    const category = classification?.category || "General";
    const subCategory = classification?.subCategory || "General Inquiry";

    helpdeskSmartService.createTicket({
      title: ticketTitle,
      description: ticketDesc,
      category,
      subCategory,
      location: `${tower}, Flat ${flatNo}`,
      tower,
      flatNumber: flatNo,
      priority,
    });

    loadData();
    setIsCreateOpen(false);
    setTicketTitle("");
    setTicketDesc("");
    setClassification(null);
  };

  const handleUpdateStatus = (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    const updated = helpdeskSmartService.updateTicketStatus(
      selectedTicket.id,
      newStatus,
      actionNote || `Status updated to ${newStatus}`,
      user?.fullName || "Staff"
    );
    if (updated) {
      setSelectedTicket(updated);
      setActionNote("");
      loadData();
    }
  };

  const handleRateTicket = () => {
    if (!selectedTicket) return;
    const ok = helpdeskSmartService.submitRating(
      selectedTicket.id,
      ratingStars,
      ratingComment || "Satisfied with service."
    );
    if (ok) {
      setSelectedTicket({
        ...selectedTicket,
        residentRating: ratingStars,
        residentComment: ratingComment,
      });
      loadData();
    }
  };

  const openTicketsCount = tickets.filter((t) => t.status === "OPEN" || t.status === "ASSIGNED").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;

  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.ticketNumber.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.tower.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wrench className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mana Smart Helpdesk & Asset Care</h1>
          </div>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
            AI-assisted incident routing, SLA tracking, predictive asset maintenance, and resident satisfaction ratings.
          </p>
        </div>
        <Button
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md text-base px-6 py-6 rounded-xl flex items-center gap-2"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="w-5 h-5" />
          File Smart Ticket
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold">Open & Assigned</CardDescription>
            <CardTitle className="text-2xl font-black text-slate-900">{openTicketsCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-slate-500">Pending engineer dispatch</CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold">Work in Progress</CardDescription>
            <CardTitle className="text-2xl font-black text-amber-600">{inProgressCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-slate-500">Active maintenance tasks</CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold">Resolved Today</CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-600">{resolvedCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-slate-500">96.8% SLA compliance</CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold">Avg Resolution</CardDescription>
            <CardTitle className="text-2xl font-black text-purple-700">1.8 hrs</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-slate-500">Automated dispatch enabled</CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="grid grid-cols-3 w-full max-w-md h-auto p-1 bg-slate-100 rounded-xl">
            <TabsTrigger value="my-tickets" className="py-2.5 font-semibold text-xs">
              All Tickets ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="assets" className="py-2.5 font-semibold text-xs">
              Facility Assets
            </TabsTrigger>
            <TabsTrigger value="scorecards" className="py-2.5 font-semibold text-xs">
              Vendor Scorecards
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search tickets, tower, category..."
              className="pl-9 text-xs h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* TAB 1: Tickets List */}
        <TabsContent value="my-tickets" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTickets.map((ticket) => {
              const pConf = PRIORITY_BADGES[ticket.priority] || PRIORITY_BADGES.MEDIUM;
              const sColor = STATUS_COLORS[ticket.status] || "bg-slate-100 text-slate-800";

              return (
                <Card
                  key={ticket.id}
                  className="border hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{ticket.ticketNumber}</Badge>
                        <div className="flex items-center gap-1.5">
                          <Badge className={`text-[10px] ${pConf.className}`}>{pConf.label}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${sColor}`}>{ticket.status}</Badge>
                        </div>
                      </div>
                      <CardTitle className="text-base text-slate-900 pt-1 line-clamp-1">{ticket.title}</CardTitle>
                      <CardDescription className="text-xs text-slate-500 line-clamp-2">
                        {ticket.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg space-y-1 text-slate-600">
                        <div className="flex justify-between">
                          <span>Category:</span>
                          <strong className="text-slate-800">{ticket.category} &bull; {ticket.subCategory}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Location:</span>
                          <strong className="text-slate-800">{ticket.location}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>SLA Target:</span>
                          <span className="font-semibold text-slate-800">{ticket.slaHours} hours</span>
                        </div>
                      </div>

                      {ticket.assignedTo && (
                        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                            {ticket.assignedTo}
                          </span>
                          {ticket.residentRating && (
                            <span className="flex items-center text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-current inline mr-0.5" />
                              {ticket.residentRating}/5
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </div>

                  <CardFooter className="pt-2 border-t bg-slate-50/50 flex justify-between items-center text-xs text-slate-400">
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <span className="text-indigo-600 font-semibold flex items-center">
                      View Details &rarr;
                    </span>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: Facility Assets */}
        <TabsContent value="assets" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Tower A Passenger Lift 1", category: "Elevators", brand: "Otis Gen2", nextService: "Oct 15, 2026", status: "HEALTHY", qr: "AST-LFT-001" },
              { name: "DG Set 500kVA Main", category: "Power Backup", brand: "Cummins Power", nextService: "Nov 02, 2026", status: "HEALTHY", qr: "AST-DG-002" },
              { name: "STP Water Filtration Unit", category: "Water & Plumbing", brand: "Thermax Eco", nextService: "Oct 28, 2026", status: "SERVICE_DUE", qr: "AST-STP-003" },
              { name: "Clubhouse Swimming Pool Filter", category: "Amenities", brand: "AstralPool", nextService: "Oct 10, 2026", status: "HEALTHY", qr: "AST-POL-004" },
              { name: "Gym Matrix Commercial Treadmill 1", category: "Gym Gear", brand: "Matrix Fitness", nextService: "Oct 22, 2026", status: "IN_REPAIR", qr: "AST-GYM-005" },
              { name: "Main Gate Boom Barrier 1", category: "Gate Automation", brand: "FAAC Heavy", nextService: "Nov 15, 2026", status: "HEALTHY", qr: "AST-BOM-006" },
            ].map((asset, i) => (
              <Card key={i} className="border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-mono">{asset.qr}</Badge>
                    <Badge className={
                      asset.status === "HEALTHY" ? "bg-emerald-600" :
                      asset.status === "SERVICE_DUE" ? "bg-amber-600" : "bg-red-600"
                    }>
                      {asset.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardTitle className="text-base text-slate-900 pt-1">{asset.name}</CardTitle>
                  <CardDescription className="text-xs">{asset.category} &bull; {asset.brand}</CardDescription>
                </CardHeader>
                <CardContent className="text-xs space-y-1 pt-0 text-slate-600">
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <div className="flex justify-between">
                      <span>Next Inspection:</span>
                      <strong className="text-slate-800">{asset.nextService}</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: Vendor Scorecards */}
        <TabsContent value="scorecards" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { vendor: "Otis Elevators India", service: "Lift Maintenance AMC", slaMet: "98.5%", avgTime: "12 mins", rating: 4.8, activeTickets: 1 },
              { vendor: "AquaTech Water Solutions", service: "STP & Water Treatment", slaMet: "94.2%", avgTime: "2.1 hrs", rating: 4.6, activeTickets: 2 },
              { vendor: "Sparkle Electrical AMC", service: "Power Backup & LT Panels", slaMet: "96.0%", avgTime: "45 mins", rating: 4.7, activeTickets: 0 },
              { vendor: "FitCare Fitness Solutions", service: "Gym Equipment AMC", slaMet: "89.0%", avgTime: "4.5 hrs", rating: 4.2, activeTickets: 1 },
            ].map((v, i) => (
              <Card key={i} className="border">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base text-slate-900">{v.vendor}</CardTitle>
                    <span className="flex items-center text-amber-500 font-bold text-sm">
                      <Star className="w-4 h-4 fill-current mr-1" />
                      {v.rating}
                    </span>
                  </div>
                  <CardDescription className="text-xs">{v.service}</CardDescription>
                </CardHeader>
                <CardContent className="text-xs pt-0">
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-center">
                    <div>
                      <p className="text-slate-400 text-[10px]">SLA Met Rate</p>
                      <p className="font-bold text-emerald-600 text-sm">{v.slaMet}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">Avg Response</p>
                      <p className="font-bold text-slate-800 text-sm">{v.avgTime}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">Active Tasks</p>
                      <p className="font-bold text-blue-600 text-sm">{v.activeTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Smart Ticket Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <DialogTitle className="text-xl font-bold">File Smart Ticket</DialogTitle>
            </div>
            <DialogDescription>
              Our AI engine auto-detects urgency, categorizes your complaint, and dispatches the on-duty technician.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Complaint Title</label>
              <Input
                placeholder="e.g. Master bathroom tap dripping constantly"
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tower</label>
                <Input value={tower} onChange={(e) => setTower(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Flat No.</label>
                <Input value={flatNo} onChange={(e) => setFlatNo(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Describe the Issue</label>
              <Textarea
                placeholder="Type details in plain English (e.g. Water leaking under the sink, smell of gas, sparks in meter)..."
                rows={4}
                value={ticketDesc}
                onChange={(e) => setTicketDesc(e.target.value)}
              />
            </div>

            {/* AI Classification Live Preview */}
            {classification && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  AI Auto-Classification Preview
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-1.5 bg-white rounded border">
                    <span className="text-slate-400 block text-[10px]">Category</span>
                    <strong className="text-slate-800">{classification.category}</strong>
                  </div>
                  <div className="p-1.5 bg-white rounded border">
                    <span className="text-slate-400 block text-[10px]">Sub-Type</span>
                    <strong className="text-slate-800">{classification.subCategory}</strong>
                  </div>
                  <div className="p-1.5 bg-white rounded border">
                    <span className="text-slate-400 block text-[10px]">Priority</span>
                    <strong className={classification.priority === "EMERGENCY" ? "text-red-600" : "text-amber-600"}>
                      {classification.priority}
                    </strong>
                  </div>
                </div>

                {classification.isEmergency && (
                  <div className="p-2 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-red-900 text-[11px] font-semibold">
                    <Flame className="w-4 h-4 text-red-600 shrink-0" />
                    Critical hazard keyword detected. This ticket will be dispatched with top emergency priority.
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={handleCreateTicket}>
              Submit Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Details & Lifecycle Drawer */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="font-mono">{selectedTicket.ticketNumber}</Badge>
                  <div className="flex items-center gap-2">
                    <Badge className={PRIORITY_BADGES[selectedTicket.priority]?.className}>
                      {selectedTicket.priority}
                    </Badge>
                    <Badge variant="outline" className={STATUS_COLORS[selectedTicket.status]}>
                      {selectedTicket.status}
                    </Badge>
                  </div>
                </div>
                <DialogTitle className="text-xl font-bold text-slate-900 pt-1">{selectedTicket.title}</DialogTitle>
                <DialogDescription>
                  {selectedTicket.category} &bull; {selectedTicket.location} &bull; Filed on {new Date(selectedTicket.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Issue Description</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border leading-relaxed">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Assigned Tech Info */}
                {selectedTicket.assignedTo && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-purple-700">Assigned Technician</p>
                      <p className="font-bold text-slate-800 text-sm">{selectedTicket.assignedTo}</p>
                      <p className="text-slate-500">{selectedTicket.assignedPhone}</p>
                    </div>
                    {selectedTicket.assignedPhone && (
                      <a
                        href={`tel:${selectedTicket.assignedPhone}`}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                      >
                        Call Technician
                      </a>
                    )}
                  </div>
                )}

                {/* Status Update Actions */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800">Update Incident Lifecycle</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-semibold"
                      onClick={() => handleUpdateStatus("ASSIGNED")}
                    >
                      Mark Assigned
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold"
                      onClick={() => handleUpdateStatus("IN_PROGRESS")}
                    >
                      Start Work
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      onClick={() => handleUpdateStatus("RESOLVED")}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Mark Resolved
                    </Button>
                  </div>
                </div>

                {/* Timeline History */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800">Activity Audit Trail</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedTicket.timeline.map((entry) => (
                      <div key={entry.id} className="p-2.5 bg-slate-50 rounded-lg border text-xs space-y-0.5">
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <strong className="text-slate-700">{entry.action} by {entry.author}</strong>
                          <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-600">{entry.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resident Satisfaction Rating */}
                {selectedTicket.status === "RESOLVED" && !selectedTicket.residentRating && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                    <h4 className="font-bold text-amber-900">Resident Service Feedback</h4>
                    <p className="text-slate-600">How would you rate the technician's work and response time?</p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRatingStars(star)}
                          className={`p-1 text-lg ${star <= ratingStars ? "text-amber-500" : "text-slate-300"}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Add an optional comment..."
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                    />
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 font-bold" onClick={handleRateTicket}>
                      Submit Review
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
