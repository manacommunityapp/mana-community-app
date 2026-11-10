import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Users, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { hrmService } from "../../../services/hrm/hrmService";
import { showError } from "../../../utils/ToastUtils";
import type { OrgHierarchyNode } from "../../../types/hrm";

function HierarchyNode({ node, depth = 0 }: { node: OrgHierarchyNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.directReports.length > 0;

  return (
    <div className={`${depth > 0 ? "ml-6 border-l border-border pl-4 mt-2" : ""}`}>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer"
        onClick={() => hasChildren && setExpanded(e => !e)}
      >
        {hasChildren ? (
          expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <span className="w-4 h-4 shrink-0" />
        )}
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
          {node.firstName.charAt(0)}{node.lastName?.charAt(0) ?? ""}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{node.firstName} {node.lastName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {node.designation ?? "—"}{node.department ? ` · ${node.department}` : ""}
          </p>
        </div>
        {hasChildren && (
          <span className="text-xs text-muted-foreground shrink-0">{node.directReports.length} report{node.directReports.length !== 1 ? "s" : ""}</span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.directReports.map(child => (
            <HierarchyNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface OrgHierarchyProps {
  orgId: number;
}

export function OrgHierarchy({ orgId }: OrgHierarchyProps) {
  const [roots, setRoots] = useState<OrgHierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orgId) load();
  }, [orgId]);

  async function load() {
    setLoading(true);
    try {
      const data = await hrmService.getOrgHierarchy(orgId);
      setRoots(data);
    } catch (err: any) {
      showError(err.message || "Failed to load org chart");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-base">Organization Chart</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : roots.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No org chart data available. Set reporting managers on employee profiles to build the hierarchy.</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[480px]">
            {roots.map(root => (
              <HierarchyNode key={root.id} node={root} depth={0} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
