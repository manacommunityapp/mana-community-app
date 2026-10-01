import React, { useState } from "react";
import { AnprGateLiveMonitor } from "./AnprGateLiveMonitor";
import { AnprAuditLog } from "./AnprAuditLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Shield, Activity, FileText, Settings, Radio } from "lucide-react";

export const AnprGateManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("live");

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              ANPR Smart Gate Management
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automated Number Plate Recognition, real-time barrier control, and vehicle audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ANPR Stream Active
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Radio className="w-4 h-4" />
            Live Gate Monitor
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Audit Logs & Search
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="live">
            <AnprGateLiveMonitor />
          </TabsContent>

          <TabsContent value="audit">
            <AnprAuditLog />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};