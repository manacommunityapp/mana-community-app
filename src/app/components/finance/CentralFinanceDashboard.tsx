import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import EventIcon from "@mui/icons-material/Event";
import StorefrontIcon from "@mui/icons-material/Storefront";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LockIcon from "@mui/icons-material/Lock";
import {
  centralFinanceDashboardService,
  type CentralFinanceSummary,
} from "../../../services/finance/centralFinanceDashboardService";

function formatCrore(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  alert?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, color, icon, alert }) => (
  <Paper sx={{ p: 2.5, borderRadius: "16px", position: "relative", overflow: "hidden" }}>
    {alert && (
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: "#F59E0B",
        }}
      />
    )}
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          color: "rgba(255,255,255,0.5)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>
      <Avatar sx={{ bgcolor: `${color}22`, width: 34, height: 34 }}>
        <Box sx={{ color, display: "flex", fontSize: 18 }}>{icon}</Box>
      </Avatar>
    </Box>
    <Typography variant="h5" sx={{ color: "#fff", fontWeight: 800, lineHeight: 1.2 }}>
      {value}
    </Typography>
    {sub && (
      <Typography variant="caption" sx={{ color, fontWeight: 600, mt: 0.5, display: "block" }}>
        {sub}
      </Typography>
    )}
  </Paper>
);

interface ModuleCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: { label: string; value: string; highlight?: boolean }[];
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, icon, color, items }) => (
  <Paper sx={{ p: 2.5, borderRadius: "16px", height: "100%" }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      <Avatar sx={{ bgcolor: `${color}22`, width: 32, height: 32 }}>
        <Box sx={{ color, display: "flex", fontSize: 17 }}>{icon}</Box>
      </Avatar>
      <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700 }}>
        {title}
      </Typography>
    </Box>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {items.map((item) => (
        <Box key={item.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
            {item.label}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: item.highlight ? color : "rgba(255,255,255,0.85)", fontWeight: item.highlight ? 700 : 500 }}
          >
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  </Paper>
);

interface Props {
  communityId: number;
}

const CentralFinanceDashboard: React.FC<Props> = ({ communityId }) => {
  const [data, setData] = useState<CentralFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    centralFinanceDashboardService
      .getSummary(communityId)
      .then(setData)
      .catch((err) => setError(err?.message ?? "Failed to load financial summary"))
      .finally(() => setLoading(false));
  }, [communityId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#10B981" }} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  }

  if (!data) return null;

  const netPositive = data.netPosition >= 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{ color: "#fff", fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}
          >
            <AccountBalanceIcon sx={{ color: "#10B981" }} />
            Mana Finance Hub
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mt: 0.5 }}>
            Consolidated view across all modules — billing, sports, events, marketplace & more.
          </Typography>
        </Box>
        {data.societyPendingApprovals > 0 && (
          <Chip
            icon={<WarningAmberIcon />}
            label={`${data.societyPendingApprovals} pending approvals`}
            sx={{ bgcolor: "#F59E0B22", color: "#F59E0B", border: "1px solid #F59E0B55", fontWeight: 700 }}
          />
        )}
      </Box>

      {/* Top-level KPI rollups */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Collected"
            value={formatCrore(data.totalCollected)}
            sub="All modules combined"
            color="#10B981"
            icon={<TrendingUpIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Outstanding"
            value={formatCrore(data.totalOutstanding)}
            sub={data.maintenanceOverdueInvoices > 0 ? `${data.maintenanceOverdueInvoices} invoices overdue` : "No overdue invoices"}
            color="#EF4444"
            icon={<ReceiptLongIcon />}
            alert={data.maintenanceOverdueInvoices > 0}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Expenses"
            value={formatCrore(data.totalExpenses)}
            sub={`${data.societyPendingApprovals} pending approvals`}
            color="#F59E0B"
            icon={<TrendingDownIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Net Position"
            value={formatCrore(Math.abs(data.netPosition))}
            sub={netPositive ? "Surplus" : "Deficit"}
            color={netPositive ? "#10B981" : "#EF4444"}
            icon={<AccountBalanceIcon />}
          />
        </Grid>
      </Grid>

      {/* Escrow summary banner */}
      {data.totalEscrowHeld > 0 && (
        <Paper
          sx={{
            p: 2,
            borderRadius: "14px",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            bgcolor: "rgba(99, 102, 241, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <LockIcon sx={{ color: "#6366F1", fontSize: 20 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700 }}>
              {formatCrore(data.totalEscrowHeld)} held in escrow
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
              Sports: {formatCrore(data.sportsEscrowHeld)} ({data.sportsEscrowPendingCount} tournaments) ·
              Events: {formatCrore(data.eventsEscrowHeld)}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Module-level breakdown */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <ModuleCard
            title="Maintenance Billing"
            icon={<AccountBalanceIcon />}
            color="#4F6AF5"
            items={[
              { label: "Total Billed", value: formatCrore(data.maintenanceTotalBilled) },
              { label: "Collected", value: formatCrore(data.maintenanceTotalCollected), highlight: true },
              { label: "Outstanding", value: formatCrore(data.maintenanceTotalOutstanding) },
              { label: "Overdue", value: formatCrore(data.maintenanceTotalOverdue) },
              { label: "Pending Invoices", value: String(data.maintenancePendingInvoices) },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <ModuleCard
            title="Sports & Tournaments"
            icon={<EmojiEventsIcon />}
            color="#F59E0B"
            items={[
              { label: "Collected", value: formatCrore(data.sportsTotalCollected), highlight: true },
              { label: "In Escrow", value: formatCrore(data.sportsEscrowHeld) },
              { label: "Active Escrows", value: String(data.sportsEscrowPendingCount) },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <ModuleCard
            title="Events"
            icon={<EventIcon />}
            color="#8B5CF6"
            items={[
              { label: "Collected", value: formatCrore(data.eventsTotalCollected), highlight: true },
              { label: "In Escrow", value: formatCrore(data.eventsEscrowHeld) },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <ModuleCard
            title="Marketplace"
            icon={<StorefrontIcon />}
            color="#10B981"
            items={[
              { label: "Collected", value: formatCrore(data.marketplaceTotalCollected), highlight: true },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <ModuleCard
            title="Resource Booking"
            icon={<MeetingRoomIcon />}
            color="#06B6D4"
            items={[
              { label: "Collected", value: formatCrore(data.resourceBookingTotalCollected), highlight: true },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <ModuleCard
            title="Finance Module"
            icon={<ReceiptLongIcon />}
            color="#EC4899"
            items={[
              { label: "Invoice Outstanding", value: formatCrore(data.financeInvoicesOutstanding) },
              { label: "Total Invoices", value: String(data.financeInvoiceCount) },
              { label: "Society Expenses", value: formatCrore(data.societyApprovedExpenses), highlight: true },
              { label: "Pending Approvals", value: String(data.societyPendingApprovals) },
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CentralFinanceDashboard;
