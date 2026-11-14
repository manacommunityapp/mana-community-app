import { format } from "date-fns";
import { escapeHtml } from "./sanitize";
import type { UniqueTournamentPlayer } from "../services/sports/tournamentPaymentService";
import { formatFlatLabel } from "./sportsValidationUtils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── 1. Player Registrations Exports ─────────────────────────────────────────

export interface ExportablePlayer {
  id?: number | string;
  playerName?: string;
  fullName?: string;
  email?: string;
  flatNumber?: string;
  age?: number;
  gender?: string;
  role?: string;
  relation?: string;
  status?: string;
  seed?: number | null;
  categoryName?: string;
  category?: { name?: string; gender?: string; minAge?: number; maxAge?: number };
  eventName?: string;
  sportName?: string;
  registeredAt?: string | Date;
  proposedTeamName?: string;
  user?: { fullName?: string; email?: string };
  matchFormat?: string;
  matchType?: string;
  partnerName?: string;
  partnerFlatNumber?: string;
  partnerPhone?: string;
  partnerStatus?: string;
  partnerConfirmationStatus?: string;
  partner?: { fullName?: string; name?: string; flatNo?: string; phone?: string };
  partnerFamilyMember?: { name?: string; relation?: string };
}

export function extractPartnerExportDetails(p: ExportablePlayer): { partnerName: string; partnerContact: string; partnerStatus: string } {
  const isOpenPool = Boolean((p as any).openPool || (p as any).isPoolPlayer || (p as any).needsPartner);
  const rawPartnerName = (p.partnerFamilyMember?.name || (p as any).partnerFamilyMemberName || p.partnerName || p.partner?.fullName || p.partner?.name || "").trim();
  const primaryName = (p.playerName || p.fullName || p.user?.fullName || "").trim();
  const partnerFamId = (p as any).partnerFamilyMemberId != null ? String((p as any).partnerFamilyMemberId) : (p.partnerFamilyMember as any)?.id != null ? String((p.partnerFamilyMember as any).id) : null;
  const primaryFamId = (p as any).familyMemberId != null ? String((p as any).familyMemberId) : (p as any).familyMember?.id != null ? String((p as any).familyMember.id) : null;
  const isSameFamId = Boolean(partnerFamId && primaryFamId && partnerFamId === primaryFamId);
  const isSelfPartner = isSameFamId || Boolean(rawPartnerName && primaryName && rawPartnerName.toLowerCase() === primaryName.toLowerCase());
  const partnerName = isSelfPartner ? "" : rawPartnerName;

  const rawFlat = p.partnerFlatNumber || p.partner?.flatNo || "";
  const partnerBlock = (p.partner as any)?.block || (p as any).partnerBlock;
  const flat = formatFlatLabel(rawFlat, partnerBlock);
  const phone = p.partnerPhone || p.partner?.phone || "";
  const contactParts: string[] = [];
  if (flat) contactParts.push(flat);
  if (phone) contactParts.push(phone);
  const partnerContact = contactParts.join(" · ") || (partnerName ? "—" : "—");

  let partnerStatus = p.partnerConfirmationStatus || p.partnerStatus || "";
  if (partnerStatus) {
    const s = partnerStatus.toUpperCase();
    if (s === "CONFIRMED" || s === "ACCEPTED") partnerStatus = "Confirmed";
    else if (s === "DECLINED" || s === "REJECTED") partnerStatus = "Declined";
    else if (s === "PENDING" || s === "INVITED") partnerStatus = "Invited";
  } else if (partnerName) {
    partnerStatus = "Invited";
  } else if (isOpenPool) {
    partnerStatus = "Looking for Partner";
  } else {
    const fmt = (p.matchFormat || (p as any).matchType || p.categoryName || "").toUpperCase();
    if (fmt.includes("DOUBLES")) {
      partnerStatus = "Looking for Partner";
    } else {
      partnerStatus = "—";
    }
  }

  const finalPartnerName = partnerName || (isOpenPool || partnerStatus === "Looking for Partner" ? "Open Pairing Pool" : "—");

  return {
    partnerName: finalPartnerName,
    partnerContact: partnerContact || "—",
    partnerStatus: partnerStatus || "—",
  };
}

export function exportPlayersToCSV(players: ExportablePlayer[], title = "Player_Registrations") {
  const headers = [
    "S.No",
    "Player Name",
    "Category",
    "Flat / Unit No",
    "Age",
    "Gender",
    "Role / Type",
    "Relation",
    "Partner Name",
    "Partner Flat / Contact",
    "Partner Status",
    "Status",
    "Seed",
    "Proposed Team",
    "Registered On",
  ];

  const rows = players.map((p, idx) => {
    const pName = p.playerName || p.user?.fullName || p.fullName || "—";
    const cat = p.categoryName || p.category?.name || "—";
    const flat = p.flatNumber || "—";
    const age = p.age ?? "—";
    const gender = p.gender || p.category?.gender || "—";
    const role = p.role || "—";
    const relation = p.relation || "Self";
    const status = p.status || "CONFIRMED";
    const seed = p.seed ?? "—";
    const team = p.proposedTeamName || "—";
    const regDate = p.registeredAt ? format(new Date(p.registeredAt), "yyyy-MM-dd HH:mm") : "—";
    const { partnerName, partnerContact, partnerStatus } = extractPartnerExportDetails(p);

    return [
      idx + 1,
      escapeCSV(pName),
      escapeCSV(cat),
      escapeCSV(flat),
      escapeCSV(age),
      escapeCSV(gender),
      escapeCSV(role),
      escapeCSV(relation),
      escapeCSV(partnerName),
      escapeCSV(partnerContact),
      escapeCSV(partnerStatus),
      escapeCSV(status),
      escapeCSV(seed),
      escapeCSV(team),
      escapeCSV(regDate),
    ].join(",");
  });

  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  triggerDownload(csv, `${sanitizedTitle}_${format(new Date(), "yyyyMMdd")}.csv`, "text/csv;charset=utf-8;");
}

export function exportPlayersToExcel(players: ExportablePlayer[], title = "Player_Registrations") {
  const headers = [
    "S.No",
    "Player Name",
    "Category",
    "Flat / Unit No",
    "Age",
    "Gender",
    "Role",
    "Relation",
    "Partner Name",
    "Partner Flat / Contact",
    "Partner Status",
    "Status",
    "Seed",
    "Registered Date",
  ];

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Registered Players</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  th { background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: left; padding: 8px; border: 1px solid #cbd5e1; }
  td { padding: 6px 8px; border: 1px solid #e2e8f0; font-family: Calibri, sans-serif; font-size: 11pt; }
  .title-row { font-size: 14pt; font-weight: bold; color: #1e293b; }
</style>
</head>
<body>
<table>
  <tr><td colspan="14" class="title-row">${title} — Registered Players Roster</td></tr>
  <tr><td colspan="14">Generated on: ${format(new Date(), "MMMM d, yyyy h:mm a")} | Total: ${players.length} Players</td></tr>
  <tr></tr>
  <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;

  players.forEach((p, idx) => {
    const pName = p.playerName || p.user?.fullName || p.fullName || "—";
    const cat = p.categoryName || p.category?.name || "—";
    const flat = p.flatNumber || "—";
    const age = p.age ?? "—";
    const gender = p.gender || p.category?.gender || "—";
    const role = p.role || "—";
    const relation = p.relation || "Self";
    const status = p.status || "CONFIRMED";
    const seed = p.seed ?? "—";
    const regDate = p.registeredAt ? format(new Date(p.registeredAt), "MMM d, yyyy h:mm a") : "—";
    const { partnerName, partnerContact, partnerStatus } = extractPartnerExportDetails(p);

    html += `<tr>
      <td>${idx + 1}</td>
      <td><b>${pName}</b></td>
      <td>${cat}</td>
      <td>${flat}</td>
      <td>${age}</td>
      <td>${gender}</td>
      <td>${role}</td>
      <td>${relation}</td>
      <td>${partnerName}</td>
      <td>${partnerContact}</td>
      <td>${partnerStatus}</td>
      <td>${status}</td>
      <td>${seed}</td>
      <td>${regDate}</td>
    </tr>`;
  });

  html += `</table></body></html>`;

  const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  triggerDownload(html, `${sanitizedTitle}_${format(new Date(), "yyyyMMdd")}.xls`, "application/vnd.ms-excel");
}

export function exportPlayersToPDF(players: ExportablePlayer[], title = "Tournament Player Roster", communityName = "Community Sports") {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Please allow popups to print/export PDF");
    return;
  }

  const rowsHtml = players
    .map(
      (p, idx) => {
        const { partnerName, partnerContact, partnerStatus } = extractPartnerExportDetails(p);
        const partnerDisplay = partnerName !== "—"
          ? `${escapeHtml(partnerName)}${partnerContact !== "—" ? ` (${escapeHtml(partnerContact)})` : ""}`
          : "—";
        return `
    <tr>
      <td style="text-align:center; font-weight:bold; color:#64748b;">${idx + 1}</td>
      <td style="font-weight:600; color:#0f172a;">${escapeHtml(p.playerName || p.user?.fullName || "—")}</td>
      <td>${escapeHtml(p.categoryName || p.category?.name || "—")}</td>
      <td style="font-weight:600;">${escapeHtml(p.flatNumber || "—")}</td>
      <td>${escapeHtml(p.age ?? "—")}</td>
      <td>${escapeHtml(p.gender || p.category?.gender || "—")}</td>
      <td>${escapeHtml(p.role || "—")}</td>
      <td>${partnerDisplay}</td>
      <td><span class="badge ${partnerStatus === "Confirmed" ? "badge-confirmed" : "badge-pending"}">${escapeHtml(partnerStatus)}</span></td>
      <td style="text-align:center; font-weight:bold; color:#4f46e5;">${p.seed != null ? `#${escapeHtml(p.seed)}` : "—"}</td>
      <td><span class="badge ${p.status === "CONFIRMED" ? "badge-confirmed" : "badge-pending"}">${escapeHtml(p.status || "CONFIRMED")}</span></td>
      <td style="border-bottom: 1px dotted #cbd5e1; width: 100px;"></td>
    </tr>`;
      }
    )
    .join("");

  const content = `
<!DOCTYPE html>
<html>
<head>
  <title>${escapeHtml(title)} — Player Roster</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
    .header { border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { margin: 0; font-size: 20px; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; }
    .header .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; font-size: 11px; display: flex; gap: 24px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; padding: 8px 6px; border-bottom: 2px solid #cbd5e1; text-align: left; }
    td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    tr:nth-child(even) { background-color: #fafafa; }
    .badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
    .badge-confirmed { background: #dcfce7; color: #15803d; }
    .badge-pending { background: #fef9c3; color: #854d0e; }
    .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-top: 10px; border-top: 1px solid #e2e8f0; }
    .sign-box { margin-top: 40px; display: flex; justify-content: space-between; padding: 0 20px; font-size: 11px; }
    .sign-line { border-top: 1px solid #0f172a; width: 180px; text-align: center; padding-top: 4px; font-weight: 600; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; text-align: right;">
    <button onclick="window.print()" style="padding: 8px 16px; background:#4f46e5; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ Print / Save PDF</button>
  </div>
  <div class="header">
    <div>
      <h1>🏆 ${escapeHtml(title)}</h1>
      <div class="subtitle">${escapeHtml(communityName)} · Official Player Verification Roster</div>
    </div>
    <div style="text-align:right; font-size:11px; color:#64748b;">
      Generated: <b>${format(new Date(), "dd-MMM-yyyy HH:mm")}</b>
    </div>
  </div>

  <div class="meta-box">
    <div>Total Players: <b>${players.length}</b></div>
    <div>Status: <b>Verified Registrations</b></div>
    <div>Noticeboard Posting & Ground Roster</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px; text-align:center;">#</th>
        <th>Player Name</th>
        <th>Category</th>
        <th>Flat / Unit</th>
        <th>Age</th>
        <th>Gender</th>
        <th>Role</th>
        <th>Partner</th>
        <th>Partner Status</th>
        <th style="text-align:center;">Seed</th>
        <th>Status</th>
        <th>Player Signature</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="sign-box">
    <div class="sign-line">Tournament Convener</div>
    <div class="sign-line">Chief Referee / Umpire</div>
  </div>

  <div class="footer">
    <div>${escapeHtml(communityName)} Sports Management Hub</div>
    <div>Page 1 of 1</div>
  </div>
</body>
</html>`;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
}

// ─── 2. Match Schedule & Fixture Exports ─────────────────────────────────────

export interface ExportableMatch {
  id?: number | string;
  matchNumber?: number | string;
  round?: string;
  roundName?: string;
  roundNumber?: number;
  groupName?: string;
  stage?: string;
  name?: string;
  sport?: string;
  venue?: string;
  time?: string;
  team1?: string;
  team2?: string;
  score1?: string | number;
  score2?: string | number;
  date?: string | Date;
  scheduledTime?: string;
  venueName?: string;
  courtName?: string;
  team1Name?: string;
  team2Name?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  team1Flat?: string;
  team2Flat?: string;
  homeFlat?: string;
  awayFlat?: string;
  home?: string | { id?: string | number; name?: string; flatNumber?: string; [key: string]: any };
  away?: string | { id?: string | number; name?: string; flatNumber?: string; [key: string]: any };
  homeScore?: number | string;
  awayScore?: number | string;
  status?: string;
  winnerName?: string;
  sportName?: string;
}

function getExportVenueCourt(match: ExportableMatch): string {
  const rawVenue = match.venue as any;
  const rawCourt = (match as any).court;
  const venueName = typeof rawVenue === "string" ? rawVenue : rawVenue?.name || match.venueName || "";
  const courtName = typeof rawCourt === "string" ? rawCourt : rawCourt?.name || match.courtName || (match as any).courtId || "";
  if (venueName && courtName) {
    if (venueName.toLowerCase().includes(String(courtName).toLowerCase())) return venueName;
    return `${venueName} · ${String(courtName).toLowerCase().startsWith("court") ? courtName : `Court ${courtName}`}`;
  }
  return venueName || (courtName ? (String(courtName).toLowerCase().startsWith("court") ? courtName : `Court ${courtName}`) : "Main Arena");
}

function sortExportMatches(matches: ExportableMatch[]): ExportableMatch[] {
  return matches
    .map((match, index) => ({ match, index, number: Number(match.matchNumber) }))
    .sort((a, b) => {
      const numberA = Number.isFinite(a.number) && a.number > 0 ? a.number : a.index + 1;
      const numberB = Number.isFinite(b.number) && b.number > 0 ? b.number : b.index + 1;
      return numberA - numberB || a.index - b.index;
    })
    .map(({ match }) => match);
}


export function exportScheduleToCSV(matches: ExportableMatch[], title = "Tournament_Schedule") {
  const orderedMatches = sortExportMatches(matches);
  const headers = [
    "Match #",
    "Round / Stage",
    "Sport",
    "Date",
    "Time",
    "Venue / Court",
    "Team 1 / Player 1",
    "Team 1 Flat",
    "Team 2 / Player 2",
    "Team 2 Flat",
    "Score",
    "Status",
    "Winner",
  ];

  const rows = orderedMatches.map((m, idx) => {
    const matchNum = m.matchNumber ?? (idx + 1);
    const round = m.name || m.roundName || m.stage || (m.roundNumber ? `Round ${m.roundNumber}` : "League Match");
    const sport = m.sport || m.sportName || "—";
    const mDate = m.date ? (typeof m.date === "string" ? m.date : format(m.date, "yyyy-MM-dd")) : "—";
    const mTime = m.time || m.scheduledTime || "—";
    const venue = getExportVenueCourt(m);
    const t1 = m.team1 || m.team1Name || m.homeTeamName || (typeof m.home === 'string' ? m.home : m.home?.name) || "TBD";
    const t2 = m.team2 || m.team2Name || m.awayTeamName || (typeof m.away === 'string' ? m.away : m.away?.name) || "TBD";
    const t1Flat = m.team1Flat || m.homeFlat || (typeof m.home === 'object' ? m.home?.flatNumber : undefined) || "—";
    const t2Flat = m.team2Flat || m.awayFlat || (typeof m.away === 'object' ? m.away?.flatNumber : undefined) || "—";
    const s1 = m.score1 ?? m.homeScore;
    const s2 = m.score2 ?? m.awayScore;
    const score = s1 != null && s2 != null && (s1 !== "" || s2 !== "") ? `${s1} - ${s2}` : "—";
    const status = m.status || "SCHEDULED";
    const winner = m.winnerName || "—";

    return [
      matchNum,
      escapeCSV(round),
      escapeCSV(sport),
      escapeCSV(mDate),
      escapeCSV(mTime),
      escapeCSV(venue),
      escapeCSV(t1),
      escapeCSV(t1Flat),
      escapeCSV(t2),
      escapeCSV(t2Flat),
      escapeCSV(score),
      escapeCSV(status),
      escapeCSV(winner),
    ].join(",");
  });

  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  triggerDownload(csv, `${sanitizedTitle}_${format(new Date(), "yyyyMMdd")}.csv`, "text/csv;charset=utf-8;");
}


export interface RoundExportTheme {
  name: string;
  bgHex: string;
  borderHex: string;
  textHex: string;
  badgeBg: string;
  badgeText: string;
  accentBar: string;
  icon: string;
}

export function rankStage(name: string): number {
  const s = (name || '').toLowerCase().trim();

  // 1. Group / Pool stages: Group A (11), Group B (12), etc.
  if (s.includes('group 1') || s.includes('group a') || s.includes('pool a')) return 11;
  if (s.includes('group 2') || s.includes('group b') || s.includes('pool b')) return 12;
  if (s.includes('group 3') || s.includes('group c') || s.includes('pool c')) return 13;
  if (s.includes('group 4') || s.includes('group d') || s.includes('pool d')) return 14;
  if (s.includes('group 5') || s.includes('group e') || s.includes('pool e')) return 15;
  if (s.includes('group 6') || s.includes('group f') || s.includes('pool f')) return 16;
  if (s.includes('group') || s.includes('pool')) return 18;
  if (s.includes('round robin') || s.includes('league')) return 19;

  // 2. Explicit early rounds: Round 1, Round 2, Round 3...
  if (/\b(round\s*0?1|1st\s*round|first\s*round|r1)\b/i.test(s)) return 21;
  if (/\b(round\s*0?2|2nd\s*round|second\s*round|r2)\b/i.test(s)) return 22;
  if (/\b(round\s*0?3|3rd\s*round|third\s*round|r3)\b/i.test(s)) return 23;
  if (/\b(round\s*0?4|4th\s*round|fourth\s*round|r4)\b/i.test(s)) return 24;
  if (/\b(round\s*0?5|5th\s*round|fifth\s*round|r5)\b/i.test(s)) return 25;
  if (/\b(round\s*0?6|6th\s*round|sixth\s*round|r6)\b/i.test(s)) return 26;
  if (/\b(round\s*0?7|7th\s*round|seventh\s*round|r7)\b/i.test(s)) return 27;
  if (/\b(round\s*0?8|8th\s*round|eighth\s*round|r8)\b/i.test(s)) return 28;

  // General "round X"
  const m = s.match(/\bround\s*(\d+)\b/i);
  if (m) {
    const num = parseInt(m[1], 10);
    if (num === 128) return 30;
    if (num === 64) return 32;
    if (num === 32) return 34;
    if (num === 16) return 36;
    return 20 + num;
  }

  // 3. Named knockout stages
  if (s.includes('128') || s.includes('round of 128')) return 30;
  if (s.includes('64') || s.includes('round of 64')) return 32;
  if (s.includes('32') || s.includes('round of 32') || s.includes('r32')) return 34;
  if (s.includes('16') || s.includes('round of 16') || s.includes('r16') || s.includes('pre-quarter')) return 36;

  // 4. Quarters, Semis, 3rd Place, Final
  if (s.includes('quarter') || s.includes('qf')) return 40;
  if (s.includes('semi') || s.includes('sf')) return 50;
  if (s.includes('third') || s.includes('bronze') || s.includes('3rd')) return 60;
  if (s.includes('final')) return 70;

  return 85;
}

export function getRoundExportTheme(stageName: string): RoundExportTheme {
  const s = (stageName || '').toLowerCase().trim();

  // Final - Warm Gold / Amber
  if (s.includes('final') && !s.includes('semi') && !s.includes('quarter') && !s.includes('third') && !s.includes('bronze')) {
    return {
      name: stageName,
      bgHex: '#fef3c7',
      borderHex: '#fcd34d',
      textHex: '#92400e',
      badgeBg: '#fde68a',
      badgeText: '#78350f',
      accentBar: '#f59e0b',
      icon: '🏆',
    };
  }

  // Semi-Final - Soft Purple / Indigo
  if (s.includes('semi') || s.includes('sf')) {
    return {
      name: stageName,
      bgHex: '#f3e8ff',
      borderHex: '#d8b4fe',
      textHex: '#6b21a8',
      badgeBg: '#e9d5ff',
      badgeText: '#581c87',
      accentBar: '#a855f7',
      icon: '⚔️',
    };
  }

  // 3rd Place / Bronze - Light Coral / Rose
  if (s.includes('third') || s.includes('bronze') || s.includes('3rd')) {
    return {
      name: stageName,
      bgHex: '#ffe4e6',
      borderHex: '#fda4af',
      textHex: '#9f1239',
      badgeBg: '#fecdd3',
      badgeText: '#881337',
      accentBar: '#f43f5e',
      icon: '🥉',
    };
  }

  // Quarter-Final - Light Sky / Cyan
  if (s.includes('quarter') || s.includes('qf')) {
    return {
      name: stageName,
      bgHex: '#e0f2fe',
      borderHex: '#7dd3fc',
      textHex: '#0369a1',
      badgeBg: '#bae6fd',
      badgeText: '#0c4a6e',
      accentBar: '#0284c7',
      icon: '🎯',
    };
  }

  // Numbered Rounds: Round 1 / 1st Round
  if (/\b(round\s*0?1|1st\s*round|first\s*round|r1)\b/i.test(s)) {
    return {
      name: stageName,
      bgHex: '#dcfce7',
      borderHex: '#86efac',
      textHex: '#166534',
      badgeBg: '#bbf7d0',
      badgeText: '#14532d',
      accentBar: '#22c55e',
      icon: '🌱',
    };
  }

  // Round 2 / 2nd Round
  if (/\b(round\s*0?2|2nd\s*round|second\s*round|r2)\b/i.test(s)) {
    return {
      name: stageName,
      bgHex: '#e0f2fe',
      borderHex: '#7dd3fc',
      textHex: '#0369a1',
      badgeBg: '#bae6fd',
      badgeText: '#0c4a6e',
      accentBar: '#38bdf8',
      icon: '⚡',
    };
  }

  // Round 3 / 3rd Round
  if (/\b(round\s*0?3|3rd\s*round|third\s*round|r3)\b/i.test(s)) {
    return {
      name: stageName,
      bgHex: '#ccfbf1',
      borderHex: '#5eead4',
      textHex: '#115e59',
      badgeBg: '#99f6e4',
      badgeText: '#134e4a',
      accentBar: '#14b8a6',
      icon: '🎯',
    };
  }

  // Round 4 / 4th Round
  if (/\b(round\s*0?4|4th\s*round|fourth\s*round|r4)\b/i.test(s)) {
    return {
      name: stageName,
      bgHex: '#e0e7ff',
      borderHex: '#a5b4fc',
      textHex: '#3730a3',
      badgeBg: '#c7d2fe',
      badgeText: '#312e81',
      accentBar: '#6366f1',
      icon: '💫',
    };
  }

  // Round of 16 / Pre-Quarter
  if (s.includes('16') || s.includes('round of 16') || s.includes('r16')) {
    return {
      name: stageName,
      bgHex: '#d1fae5',
      borderHex: '#6ee7b7',
      textHex: '#065f46',
      badgeBg: '#a7f3d0',
      badgeText: '#064e3b',
      accentBar: '#10b981',
      icon: '⚡',
    };
  }

  // Round of 32
  if (s.includes('32') || s.includes('round of 32') || s.includes('r32')) {
    return {
      name: stageName,
      bgHex: '#ccfbf1',
      borderHex: '#5eead4',
      textHex: '#115e59',
      badgeBg: '#99f6e4',
      badgeText: '#134e4a',
      accentBar: '#14b8a6',
      icon: '🏸',
    };
  }

  // Group 1 / Pool A - Light Blue
  if (s.includes('group 1') || s.includes('group a') || s.includes('pool a')) {
    return {
      name: stageName,
      bgHex: '#dbeafe',
      borderHex: '#93c5fd',
      textHex: '#1e40af',
      badgeBg: '#bfdbfe',
      badgeText: '#1e3a8a',
      accentBar: '#3b82f6',
      icon: '🛡️',
    };
  }

  // Group 2 / Pool B - Light Teal
  if (s.includes('group 2') || s.includes('group b') || s.includes('pool b')) {
    return {
      name: stageName,
      bgHex: '#ccfbf1',
      borderHex: '#5eead4',
      textHex: '#115e59',
      badgeBg: '#99f6e4',
      badgeText: '#134e4a',
      accentBar: '#14b8a6',
      icon: '🛡️',
    };
  }

  // Group 3 / Pool C - Light Fuchsia
  if (s.includes('group 3') || s.includes('group c') || s.includes('pool c')) {
    return {
      name: stageName,
      bgHex: '#fae8ff',
      borderHex: '#f0abfc',
      textHex: '#86198f',
      badgeBg: '#f5d0fe',
      badgeText: '#701a75',
      accentBar: '#d946ef',
      icon: '🛡️',
    };
  }

  // Group 4 / Pool D - Light Orange
  if (s.includes('group 4') || s.includes('group d') || s.includes('pool d')) {
    return {
      name: stageName,
      bgHex: '#ffedd5',
      borderHex: '#fdba74',
      textHex: '#9a3412',
      badgeBg: '#fed7aa',
      badgeText: '#7c2d12',
      accentBar: '#f97316',
      icon: '🛡️',
    };
  }

  // Round Robin / League - Light Indigo
  if (s.includes('round robin') || s.includes('league')) {
    return {
      name: stageName,
      bgHex: '#e0e7ff',
      borderHex: '#a5b4fc',
      textHex: '#3730a3',
      badgeBg: '#c7d2fe',
      badgeText: '#312e81',
      accentBar: '#6366f1',
      icon: '🔄',
    };
  }

  // Default / Other Stages - Clean Light Slate
  return {
    name: stageName,
    bgHex: '#f1f5f9',
    borderHex: '#cbd5e1',
    textHex: '#334155',
    badgeBg: '#e2e8f0',
    badgeText: '#1e293b',
    accentBar: '#64748b',
    icon: '📋',
  };
}

export function exportScheduleToExcel(matches: ExportableMatch[], title = "Tournament_Schedule") {
  const orderedMatches = sortExportMatches(matches);
  const headers = [
    "Match #",
    "Stage / Round",
    "Sport",
    "Match Date",
    "Time",
    "Venue / Court",
    "Team 1 / Player 1",
    "Team 1 Flat",
    "Team 2 / Player 2",
    "Team 2 Flat",
    "Score",
    "Status",
    "Winner",
  ];

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Schedule</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  th { background-color: #4f46e5; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; }
  td { padding: 6px 8px; border: 1px solid #e2e8f0; font-family: Calibri, sans-serif; font-size: 11pt; }
  .title-row { font-size: 14pt; font-weight: bold; color: #1e293b; }
  .flat-cell { color: #4338ca; font-weight: 600; }
</style>
</head>
<body>
<table>
  <tr><td colspan="13" class="title-row">${title} — Official Match Schedule & Fixtures</td></tr>
  <tr><td colspan="13">Generated on: ${format(new Date(), "MMMM d, yyyy h:mm a")} | Total Matches: ${orderedMatches.length}</td></tr>
  <tr></tr>
  <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;

  orderedMatches.forEach((m, idx) => {
    const matchNum = m.matchNumber ?? (idx + 1);
    const round = m.name || m.roundName || m.stage || (m.roundNumber ? `Round ${m.roundNumber}` : "League Match");
    const sport = m.sport || m.sportName || "—";
    const mDate = m.date ? (typeof m.date === "string" ? m.date : format(m.date, "yyyy-MM-dd")) : "—";
    const mTime = m.time || m.scheduledTime || "—";
    const venue = getExportVenueCourt(m);
    const t1 = m.team1 || m.team1Name || m.homeTeamName || (typeof m.home === 'string' ? m.home : m.home?.name) || "TBD";
    const t2 = m.team2 || m.team2Name || m.awayTeamName || (typeof m.away === 'string' ? m.away : m.away?.name) || "TBD";
    const t1Flat = m.team1Flat || m.homeFlat || (typeof m.home === 'object' ? m.home?.flatNumber : undefined) || "—";
    const t2Flat = m.team2Flat || m.awayFlat || (typeof m.away === 'object' ? m.away?.flatNumber : undefined) || "—";
    const s1 = m.score1 ?? m.homeScore;
    const s2 = m.score2 ?? m.awayScore;
    const score = s1 != null && s2 != null && (s1 !== "" || s2 !== "") ? `${s1} - ${s2}` : "—";
    const status = m.status || "SCHEDULED";
    const winner = m.winnerName || "—";

    html += `<tr>
      <td>${matchNum}</td>
      <td>${round}</td>
      <td>${sport}</td>
      <td>${mDate}</td>
      <td>${mTime}</td>
      <td>${venue}</td>
      <td><b>${t1}</b></td>
      <td class="flat-cell">${t1Flat !== "—" ? t1Flat : "—"}</td>
      <td><b>${t2}</b></td>
      <td class="flat-cell">${t2Flat !== "—" ? t2Flat : "—"}</td>
      <td>${score}</td>
      <td>${status}</td>
      <td>${winner}</td>
    </tr>`;
  });

  html += `</table></body></html>`;

  const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  triggerDownload(html, `${sanitizedTitle}_${format(new Date(), "yyyyMMdd")}.xls`, "application/vnd.ms-excel");
}

export function exportScheduleToPDF(matches: ExportableMatch[], title = "Tournament Fixtures", communityName = "Community Sports") {
  const orderedMatches = sortExportMatches(matches);
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Please allow popups to print/export PDF");
    return;
  }

  const rowsHtml = orderedMatches
    .map((m, idx) => {
      const matchNum = m.matchNumber ?? (idx + 1);
      const round = m.name || m.roundName || m.stage || (m.roundNumber ? `Round ${m.roundNumber}` : "Match");
      const mDate = m.date ? (typeof m.date === "string" ? m.date : format(m.date, "dd-MMM-yyyy")) : "—";
      const mTime = m.time || m.scheduledTime || "—";
      const venue = getExportVenueCourt(m);
      const t1 = m.team1 || m.team1Name || m.homeTeamName || (typeof m.home === 'string' ? m.home : m.home?.name) || "TBD";
      const t2 = m.team2 || m.team2Name || m.awayTeamName || (typeof m.away === 'string' ? m.away : m.away?.name) || "TBD";
      const t1Flat = m.team1Flat || m.homeFlat || (typeof m.home === 'object' ? m.home?.flatNumber : undefined);
      const t2Flat = m.team2Flat || m.awayFlat || (typeof m.away === 'object' ? m.away?.flatNumber : undefined);
      const s1 = m.score1 ?? m.homeScore;
      const s2 = m.score2 ?? m.awayScore;
      const score = s1 != null && s2 != null && (s1 !== "" || s2 !== "") ? `${s1} : ${s2}` : "vs";

      return `
      <tr>
        <td style="text-align:center; font-weight:bold; color:#64748b;">#${escapeHtml(matchNum)}</td>
        <td style="font-weight:600; color:#4f46e5;">${escapeHtml(round)}</td>
        <td><b>${escapeHtml(mDate)}</b><br><span style="color:#64748b; font-size:10px;">${escapeHtml(mTime)}</span></td>
        <td>${escapeHtml(venue)}</td>
        <td style="text-align:right; font-size:12px;">
          <div style="font-weight:bold;">${escapeHtml(t1)}</div>
          ${t1Flat ? `<div style="font-size:10px; color:#4f46e5; font-weight:600; margin-top:2px;">🏠 ${escapeHtml(t1Flat)}</div>` : ""}
        </td>
        <td style="text-align:center; font-weight:bold; color:#e11d48; background:#fff1f2; padding:4px 8px; border-radius:4px;">${escapeHtml(score)}</td>
        <td style="text-align:left; font-size:12px;">
          <div style="font-weight:bold;">${escapeHtml(t2)}</div>
          ${t2Flat ? `<div style="font-size:10px; color:#4f46e5; font-weight:600; margin-top:2px;">🏠 ${escapeHtml(t2Flat)}</div>` : ""}
        </td>
        <td style="text-align:center;"><span class="badge badge-scheduled">${escapeHtml(m.status || "SCHEDULED")}</span></td>
      </tr>`;
    })
    .join("");

  const content = `
<!DOCTYPE html>
<html>
<head>
  <title>${escapeHtml(title)} — Match Schedule</title>
  <style>
    @page { size: A4 landscape; margin: 12mm 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
    .header { border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { margin: 0; font-size: 20px; color: #1e1b4b; text-transform: uppercase; }
    .header .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; padding: 8px 6px; border-bottom: 2px solid #cbd5e1; text-align: left; }
    td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    tr:nth-child(even) { background-color: #fafafa; }
    .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
    .badge-scheduled { background: #e0e7ff; color: #4338ca; }
    .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-top: 10px; border-top: 1px solid #e2e8f0; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; text-align: right;">
    <button onclick="window.print()" style="padding: 8px 16px; background:#4f46e5; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ Print Fixtures / Save PDF</button>
  </div>
  <div class="header">
    <div>
      <h1>📅 ${escapeHtml(title)}</h1>
      <div class="subtitle">${escapeHtml(communityName)} · Official Tournament Schedule & Fixtures</div>
    </div>
    <div style="text-align:right; font-size:11px; color:#64748b;">
      Generated: <b>${format(new Date(), "dd-MMM-yyyy HH:mm")}</b>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:40px; text-align:center;">Match</th>
        <th>Round / Stage</th>
        <th>Date & Time</th>
        <th>Venue / Court</th>
        <th style="text-align:right;">Team 1 / Player 1</th>
        <th style="width:60px; text-align:center;">Score</th>
        <th style="text-align:left;">Team 2 / Player 2</th>
        <th style="text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer">
    <div>${escapeHtml(communityName)} Tournament Director</div>
    <div>Noticeboard Fixtures · Matches subject to weather conditions</div>
  </div>
</body>
</html>`;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
}

export function exportUmpireScorecardsPDF(matches: ExportableMatch[], title = "Match Scorecards") {
  const orderedMatches = sortExportMatches(matches);
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Please allow popups to print/export PDF");
    return;
  }

  const cardsHtml = orderedMatches
    .map((m, idx) => {
      const matchNum = m.matchNumber ?? (idx + 1);
      const round = m.name || m.roundName || m.stage || (m.roundNumber ? `Round ${m.roundNumber}` : "Match");
      const mDate = m.date ? (typeof m.date === "string" ? m.date : format(m.date, "dd-MMM-yyyy")) : "—";
      const mTime = m.time || m.scheduledTime || "—";
      const venue = getExportVenueCourt(m);
      const t1 = m.team1 || m.team1Name || m.homeTeamName || (typeof m.home === 'string' ? m.home : m.home?.name) || "Team A";
      const t2 = m.team2 || m.team2Name || m.awayTeamName || (typeof m.away === 'string' ? m.away : m.away?.name) || "Team B";
      const t1Flat = m.team1Flat || m.homeFlat || (typeof m.home === 'object' ? m.home?.flatNumber : undefined);
      const t2Flat = m.team2Flat || m.awayFlat || (typeof m.away === 'object' ? m.away?.flatNumber : undefined);

      return `
      <div class="scorecard">
        <div class="scorecard-header">
          <div>
            <span class="badge">MATCH #${escapeHtml(matchNum)}</span>
            <span style="font-weight:bold; margin-left:8px; color:#4f46e5;">${escapeHtml(round)}</span>
          </div>
          <div style="font-size:10px; color:#64748b;">
            📅 ${escapeHtml(mDate)} at ${escapeHtml(mTime)} | 📍 ${escapeHtml(venue)}
          </div>
        </div>

        <table class="score-table">
          <thead>
            <tr>
              <th style="width: 45%;">Team / Competitor</th>
              <th style="width: 10%;">Set 1</th>
              <th style="width: 10%;">Set 2</th>
              <th style="width: 10%;">Set 3</th>
              <th style="width: 15%;">Total Score</th>
              <th style="width: 10%;">Winner</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-size:12px;">
                <div style="font-weight:bold;">${escapeHtml(t1)}</div>
                ${t1Flat ? `<div style="font-size:9.5px; color:#4f46e5; font-weight:600; margin-top:2px;">🏠 Flat: ${escapeHtml(t1Flat)}</div>` : ""}
              </td>
              <td></td><td></td><td></td><td></td><td>[ &nbsp; ]</td>
            </tr>
            <tr>
              <td style="font-size:12px;">
                <div style="font-weight:bold;">${escapeHtml(t2)}</div>
                ${t2Flat ? `<div style="font-size:9.5px; color:#4f46e5; font-weight:600; margin-top:2px;">🏠 Flat: ${escapeHtml(t2Flat)}</div>` : ""}
              </td>
              <td></td><td></td><td></td><td></td><td>[ &nbsp; ]</td>
            </tr>
          </tbody>
        </table>

        <div class="scorecard-footer">
          <div class="sig-block">Toss Won By: _________________</div>
          <div class="sig-block">Player 1 Sign: _________________</div>
          <div class="sig-block">Player 2 Sign: _________________</div>
          <div class="sig-block">Referee Sign: _________________</div>
        </div>
      </div>`;
    })
    .join("");

  const content = `
<!DOCTYPE html>
<html>
<head>
  <title>${escapeHtml(title)} — Referee Scorecards</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 15px; }
    .scorecard { border: 2px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 18px; page-break-inside: avoid; }
    .scorecard-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 8px; }
    .badge { background: #0f172a; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
    .score-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 8px; }
    .score-table th, .score-table td { border: 1px solid #94a3b8; padding: 8px; text-align: center; }
    .score-table th { background: #f8fafc; font-size: 10px; }
    .scorecard-footer { display: flex; justify-content: space-between; font-size: 10px; color: #475569; margin-top: 8px; }
    .sig-block { font-size: 9px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; text-align: right;">
    <button onclick="window.print()" style="padding: 8px 16px; background:#0f172a; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ Print Referee Scorecards</button>
  </div>
  <h2 style="margin:0 0 12px 0; font-size:16px; text-transform:uppercase;">📝 Official Referee / Umpire Match Scorecards — ${escapeHtml(title)}</h2>
  ${cardsHtml}
</body>
</html>`;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
}

// ─── 3.5. List View Fixtures Export with Round Colors ──────────────────────────

export interface ExportableListFixture {
  id?: string | number;
  matchNumber?: string | number;
  stage?: string;
  roundName?: string;
  date?: string | Date;
  time?: string;
  duration?: number;
  venueName?: string;
  courtName?: string;
  home?: { id?: string; name: string; avatarUrl?: string; flatNumber?: string; seed?: number };
  away?: { id?: string; name: string; avatarUrl?: string; flatNumber?: string; seed?: number };
  team1?: string;
  team2?: string;
  status?: string;
  conflicts?: string[];
  isPlayoff?: boolean;
}

export function exportListViewToPDF(
  fixtures: ExportableListFixture[],
  title = "Tournament Schedule — List View",
  communityName = "Mana Community",
  sportName = "Tournament"
) {
  const printWindow = window.open("", "_blank", "width=1050,height=800");
  if (!printWindow) {
    alert("Please allow popups to print/export the tournament list");
    return;
  }

  // 1. Group fixtures by stage/round
  const stageMap = new Map<string, ExportableListFixture[]>();
  fixtures.forEach(f => {
    const stage = f.stage || f.roundName || "General Fixtures";
    if (!stageMap.has(stage)) {
      stageMap.set(stage, []);
    }
    stageMap.get(stage)!.push(f);
  });

  // 2. Sort stages in tournament chronological order:
  // Round 1 -> Round 2 -> Round 3... -> Quarters -> Semis -> Final
  const sortedStages = Array.from(stageMap.entries()).sort(
    (a, b) => rankStage(a[0]) - rankStage(b[0])
  );

  let stagesHtml = "";
  sortedStages.forEach(([stageName, stageMatches]) => {
    const theme = getRoundExportTheme(stageName);

    // Collect distinct dates
    const dates = Array.from(
      new Set(
        stageMatches
          .map(m => (m.date ? (typeof m.date === "string" ? m.date : format(m.date, "dd-MMM-yyyy")) : ""))
          .filter(Boolean)
      )
    );
    const datesSummary = dates.join(" · ");

    const matchesHtml = [...stageMatches]
      .sort((a, b) => {
        const numberA = Number(a.matchNumber);
        const numberB = Number(b.matchNumber);
        if (Number.isFinite(numberA) && Number.isFinite(numberB) && numberA !== numberB) return numberA - numberB;
        return 0;
      })
      .map(m => {
        const mNum = m.matchNumber ?? "";
        const mTime = m.time || "—";
        const mDate = m.date ? (typeof m.date === "string" ? m.date : format(m.date, "dd-MMM-yyyy")) : "";
        const courtVenue = [m.courtName, m.venueName].filter(Boolean).join(" · ") || "Main Arena";
        const durationStr = m.duration ? `${m.duration}m` : "";

        const t1 = m.home?.name || m.team1 || "TBD";
        const t1FlatVal = m.home?.flatNumber || (m as any).homeFlat || (m as any).team1Flat;
        const t1Flat = t1FlatVal ? `<span class="unit-pill">${escapeHtml(t1FlatVal)}</span>` : "";
        const t1Seed = m.home?.seed != null ? `<span class="seed-pill">#${escapeHtml(m.home.seed)}</span>` : "";

        const t2 = m.away?.name || m.team2 || "TBD";
        const t2FlatVal = m.away?.flatNumber || (m as any).awayFlat || (m as any).team2Flat;
        const t2Flat = t2FlatVal ? `<span class="unit-pill">${escapeHtml(t2FlatVal)}</span>` : "";
        const t2Seed = m.away?.seed != null ? `<span class="seed-pill">#${escapeHtml(m.away.seed)}</span>` : "";

        return `
          <div class="fixture-card">
            <div class="f-left">
              <span class="m-num" style="background:${theme.bgHex}; color:${theme.textHex}; border:1px solid ${theme.borderHex};">
                #${escapeHtml(mNum)}
              </span>
              <div class="f-timing">
                <div class="time-main">${escapeHtml(mTime)} ${durationStr ? `<span class="duration-tag">${escapeHtml(durationStr)}</span>` : ""}</div>
                <div class="date-venue">${escapeHtml(mDate)} · 📍 ${escapeHtml(courtVenue)}</div>
              </div>
            </div>

            <div class="f-teams">
              <div class="team team-home">
                <span class="t-name">${escapeHtml(t1)}</span>
                ${t1Flat}
                ${t1Seed}
              </div>

              <div class="vs-badge" style="background:${theme.bgHex}; color:${theme.textHex}; border:1px solid ${theme.borderHex};">
                VS
              </div>

              <div class="team team-away">
                ${t2Seed}
                ${t2Flat}
                <span class="t-name">${escapeHtml(t2)}</span>
              </div>
            </div>

            <div class="f-right">
              <span class="status-badge">SCHEDULED</span>
            </div>
          </div>
        `;
      })
      .join("");

    stagesHtml += `
      <div class="round-block" style="border: 1.5px solid ${theme.borderHex};">
        <div class="round-header" style="background:${theme.bgHex}; border-bottom:1.5px solid ${theme.borderHex}; color:${theme.textHex};">
          <div class="round-title-wrap">
            <span class="round-emoji">${theme.icon}</span>
            <span class="round-title-text">${escapeHtml(stageName)}</span>
            <span class="round-count-badge" style="background:${theme.badgeBg}; color:${theme.badgeText};">
              ${stageMatches.length} ${stageMatches.length === 1 ? "Match" : "Matches"}
            </span>
          </div>
          ${datesSummary ? `<div class="round-date-wrap">📅 ${escapeHtml(datesSummary)}</div>` : ""}
        </div>
        <div class="round-body">
          ${matchesHtml}
        </div>
      </div>
    `;
  });

  const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} — Official Fixtures</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 12mm; }
    @media print {
      body { margin: 0; padding: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .round-block { page-break-inside: avoid; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 24px;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 2px solid #e2e8f0;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #1e1b4b;
      margin: 0 0 3px 0;
    }
    .sub-title {
      font-size: 12px;
      color: #64748b;
    }
    .btn-print {
      padding: 8px 16px;
      background: #4f46e5;
      color: white;
      font-weight: bold;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
    }
    .round-block {
      background: white;
      border-radius: 12px;
      margin-bottom: 20px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .round-header {
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .round-title-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .round-emoji {
      font-size: 18px;
    }
    .round-title-text {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .round-count-badge {
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
    }
    .round-date-wrap {
      font-size: 11px;
      font-weight: 600;
    }
    .round-body {
      padding: 4px 8px;
    }
    .fixture-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
      gap: 12px;
    }
    .fixture-card:last-child {
      border-bottom: none;
    }
    .f-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 190px;
    }
    .m-num {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 7px;
      border-radius: 6px;
      flex-shrink: 0;
    }
    .f-timing {
      display: flex;
      flex-direction: column;
    }
    .time-main {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .duration-tag {
      font-size: 9.5px;
      font-weight: 600;
      color: #64748b;
      margin-left: 4px;
    }
    .date-venue {
      font-size: 10px;
      color: #64748b;
      margin-top: 1px;
    }
    .f-teams {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex: 1;
    }
    .team {
      display: flex;
      align-items: center;
      gap: 5px;
      flex: 1;
    }
    .team-home {
      justify-content: flex-end;
      text-align: right;
    }
    .team-away {
      justify-content: flex-start;
      text-align: left;
    }
    .t-name {
      font-size: 12.5px;
      font-weight: 700;
      color: #1e293b;
    }
    .unit-pill {
      font-size: 9.5px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 600;
    }
    .seed-pill {
      font-size: 9.5px;
      background: #e0e7ff;
      color: #4338ca;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 700;
    }
    .vs-badge {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 9999px;
      flex-shrink: 0;
    }
    .f-right {
      min-width: 80px;
      text-align: right;
    }
    .status-badge {
      font-size: 9.5px;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 7px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="top-bar no-print">
    <div>
      <h1 class="brand-title">📋 ${escapeHtml(title)}</h1>
      <div class="sub-title">${escapeHtml(communityName)} · Official ${escapeHtml(sportName)} List View Fixtures</div>
    </div>
    <div style="display:flex; gap:10px;">
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-print" style="background:#64748b;" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="list-wrapper">
    ${stagesHtml}
  </div>
</body>
</html>`;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}

// ─── 4. Knockout Bracket Draw Export ──────────────────────────────────────────

export interface ExportableBracketMatch {
  id: string;
  name?: string;
  round: string;
  roundIndex: number;
  home: { id: string; name: string; flatNumber?: string };
  away: { id: string; name: string; flatNumber?: string };
  date: string;
  time: string;
  duration?: number;
  venueId?: number | null;
  courtId?: string | null;
  venueName?: string;
  courtName?: string;
  status?: string | null;
}

export function exportBracketToPDF(
  matches: ExportableBracketMatch[],
  title = "Tournament Knockout Draw",
  communityName = "Mana Community",
  sportName = "Tournament"
) {
  const printWindow = window.open("", "_blank", "width=1280,height=850");
  if (!printWindow) {
    alert("Please allow popups to print/export the tournament bracket");
    return;
  }

  const bracketMatches = matches.filter(m => m.round !== "THIRD_PLACE");
  const thirdPlace = matches.filter(m => m.round === "THIRD_PLACE");
  const roundIndices = Array.from(new Set(bracketMatches.map(m => m.roundIndex))).sort((a, b) => a - b);

  const roundsMatches: Record<number, ExportableBracketMatch[]> = {};
  roundIndices.forEach(rIndex => {
    roundsMatches[rIndex] = bracketMatches.filter(m => m.roundIndex === rIndex);
  });

  const firstRoundMatches = roundIndices.length > 0 ? (roundsMatches[roundIndices[0]] || []) : [];
  const baseSpacing = firstRoundMatches.length > 8 ? 120 : 160;
  const matchTops: Record<string, number> = {};

  function findParentMatchId(participantId: string | undefined, prevMatches: ExportableBracketMatch[]): string | undefined {
    if (!participantId) return undefined;
    if (participantId.endsWith("-winner")) return participantId.replace("-winner", "");
    if (participantId.endsWith("-loser")) return participantId.replace("-loser", "");
    const parent = prevMatches.find(pm => pm.home?.id === participantId || pm.away?.id === participantId);
    return parent?.id;
  }

  // First round spacing
  if (roundIndices.length > 0) {
    firstRoundMatches.forEach((m, idx) => {
      matchTops[m.id] = 50 + idx * baseSpacing;
    });
  }

  // Subsequent rounds midpoints
  for (let c = 1; c < roundIndices.length; c++) {
    const rIdx = roundIndices[c];
    const prevRIdx = roundIndices[c - 1];
    const currMatches = roundsMatches[rIdx] || [];
    const prevMatches = roundsMatches[prevRIdx] || [];

    currMatches.forEach((m, idx) => {
      let homeParentId = findParentMatchId(m.home?.id, prevMatches);
      let awayParentId = findParentMatchId(m.away?.id, prevMatches);

      if (!homeParentId && !awayParentId && prevMatches.length >= (idx + 1) * 2) {
        homeParentId = prevMatches[idx * 2]?.id;
        awayParentId = prevMatches[idx * 2 + 1]?.id;
      }

      const homeTop = homeParentId ? matchTops[homeParentId] : undefined;
      const awayTop = awayParentId ? matchTops[awayParentId] : undefined;

      if (homeTop !== undefined && awayTop !== undefined) {
        matchTops[m.id] = (homeTop + awayTop) / 2;
      } else if (homeTop !== undefined) {
        matchTops[m.id] = homeTop;
      } else if (awayTop !== undefined) {
        matchTops[m.id] = awayTop;
      } else {
        matchTops[m.id] = 50 + idx * (baseSpacing * Math.pow(2, c));
      }
    });
  }

  const allTops = Object.values(matchTops);
  const maxMatchTop = allTops.length > 0 ? Math.max(...allTops) : 300;
  const bracketHeight = Math.max(maxMatchTop + 180, 520);

  function getRoundHeader(roundName: string): string {
    if (roundName === "FINAL") return "Final";
    if (roundName === "SEMI_FINAL") return "Semi-Finals";
    if (roundName === "QUARTER_FINAL") return "Quarter-Finals";
    if (roundName === "ROUND_OF_16") return "Round of 16";
    if (roundName === "ROUND_OF_32") return "Round of 32";
    if (roundName === "ROUND_OF_64") return "Round of 64";
    return roundName.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, ch => ch.toUpperCase());
  }

  let columnsHtml = "";
  roundIndices.forEach((rIndex, colIdx) => {
    const rMatches = roundsMatches[rIndex] || [];
    if (rMatches.length === 0) return;
    const header = getRoundHeader(rMatches[0].round);
    const isLastRound = colIdx === roundIndices.length - 1;

    let cardsHtml = "";
    rMatches.forEach((m, idx) => {
      const top = matchTops[m.id] ?? (50 + idx * baseSpacing);
      let showConnector = false;
      let connectorHeight = 0;
      let connectorTop = 0;

      if (colIdx > 0) {
        const prevRoundIdx = roundIndices[colIdx - 1];
        const prevMatches = roundsMatches[prevRoundIdx] || [];
        let homeParentId = findParentMatchId(m.home?.id, prevMatches);
        let awayParentId = findParentMatchId(m.away?.id, prevMatches);

        if (!homeParentId && !awayParentId && prevMatches.length >= (idx + 1) * 2) {
          homeParentId = prevMatches[idx * 2]?.id;
          awayParentId = prevMatches[idx * 2 + 1]?.id;
        }

        const homeTop = homeParentId ? matchTops[homeParentId] : undefined;
        const awayTop = awayParentId ? matchTops[awayParentId] : undefined;

        if (homeTop !== undefined && awayTop !== undefined) {
          showConnector = true;
          connectorHeight = Math.abs(awayTop - homeTop);
          connectorTop = Math.min(homeTop, awayTop) - top;
        } else if (homeTop !== undefined) {
          showConnector = true;
          connectorHeight = Math.abs(homeTop - top);
          connectorTop = Math.min(homeTop, top) - top;
        } else if (awayTop !== undefined) {
          showConnector = true;
          connectorHeight = Math.abs(awayTop - top);
          connectorTop = Math.min(awayTop, top) - top;
        }
      }

      const showMergerRight = !isLastRound;
      const showMergerLeft = colIdx > 0;
      const isHomeBye = m.home?.id === 'bye' || m.home?.name?.trim().toUpperCase() === 'BYE';
      const isAwayBye = m.away?.id === 'bye' || m.away?.name?.trim().toUpperCase() === 'BYE';
      const isByeMatch = isHomeBye || isAwayBye || m.status === 'AUTO_ADVANCED';
      const venueCourt = isByeMatch ? "" : ([m.venueName, m.courtName].filter(Boolean).join(" - ") || "TBD");

      cardsHtml += `
        <div class="matchup" style="top:${top}px;">
          <div class="match-meta">
            ${isByeMatch 
              ? `<span style="color:#059669; font-weight:800; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:1px 6px;">BYE • ADVANCES</span>`
              : `<span>${escapeHtml(m.date || "")} ${escapeHtml(m.time || "")}</span>`
            }
          </div>
          <div class="match-box">
            <div class="participant-row ${isHomeBye ? 'bye-row' : ''}">
              <span class="p-accent ${isHomeBye ? 'bye-accent' : ''}"></span>
              <span class="p-name ${isHomeBye ? 'bye-name' : ''}">${escapeHtml(m.home?.name || "TBD")}</span>
              ${m.home?.flatNumber ? `<span class="p-flat">${escapeHtml(m.home.flatNumber)}</span>` : ""}
            </div>
            <div class="participant-row ${isAwayBye ? 'bye-row' : ''}">
              <span class="p-accent ${isAwayBye ? 'bye-accent' : ''}"></span>
              <span class="p-name ${isAwayBye ? 'bye-name' : ''}">${escapeHtml(m.away?.name || "TBD")}</span>
              ${m.away?.flatNumber ? `<span class="p-flat">${escapeHtml(m.away.flatNumber)}</span>` : ""}
            </div>
            ${showConnector ? `<div class="connector" style="height:${connectorHeight}px; transform:translateY(${connectorTop}px);"></div>` : ""}
            ${showMergerRight ? `<div class="merger-right"></div>` : ""}
            ${showMergerLeft ? `<div class="merger-left"></div>` : ""}
          </div>
          ${!isByeMatch ? `<div class="court-tag">📍 ${escapeHtml(venueCourt)}</div>` : ""}
        </div>
      `;
    });

    columnsHtml += `
      <section class="round-col">
        <div class="round-header">
          <h5>${escapeHtml(header)}</h5>
        </div>
        ${cardsHtml}
      </section>
    `;
  });

  // Final match podium
  const finalRoundIdx = roundIndices[roundIndices.length - 1];
  const finalMatch = finalRoundIdx !== undefined ? (roundsMatches[finalRoundIdx] || [])[0] : undefined;
  const finalMatchTop = finalMatch ? (matchTops[finalMatch.id] ?? 160) : 160;

  let podiumHtml = "";
  if (finalMatch) {
    podiumHtml = `
      <section class="round-col results-col">
        <div class="round-header results-header">
          <h5>🏆 Results</h5>
        </div>
        <div class="results-box" style="top:${finalMatchTop + 30}px;">
          <div class="winner-box">
            <div class="trophy-icon">🏆</div>
            <div class="podium-title">Champion / Winner</div>
            <div class="podium-name">Winner Of Final</div>
          </div>
          <div class="runnerup-box">
            <div class="medal-icon">🥈</div>
            <div class="podium-title">Runner-Up (Finalist)</div>
            <div class="podium-name">Loser Of Final</div>
          </div>
        </div>
      </section>
    `;
  }

  let thirdPlaceHtml = "";
  if (thirdPlace.length > 0) {
    thirdPlaceHtml = `
      <div style="margin-top: 30px; padding: 16px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; display: inline-block;">
        <h5 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #9f1239; text-transform: uppercase;">🥉 Third Place Playoff</h5>
        ${thirdPlace.map(m => {
          const venueCourt = [m.venueName, m.courtName].filter(Boolean).join(" - ") || "TBD";
          return `
            <div style="display:flex; align-items:center; gap:12px; font-size:12px;">
              <span style="font-weight:700; color:#1e293b;">${escapeHtml(m.home?.name || "TBD")}</span>
              <span style="font-weight:800; color:#e11d48;">VS</span>
              <span style="font-weight:700; color:#1e293b;">${escapeHtml(m.away?.name || "TBD")}</span>
              <span style="color:#64748b; font-size:11px;">(${escapeHtml(m.date)} ${escapeHtml(m.time)} · ${escapeHtml(venueCourt)})</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} — Knockout Bracket</title>
  <style>
    @page { size: A3 landscape; margin: 10mm; }
    @media print {
      body { margin: 0; padding: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 24px;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e2e8f0;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #1e1b4b;
      margin: 0 0 4px 0;
    }
    .sub-title {
      font-size: 13px;
      color: #64748b;
    }
    .btn-print {
      padding: 9px 18px;
      background: #4f46e5;
      color: white;
      font-weight: bold;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
    }
    .bracket-wrapper {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      overflow-x: auto;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .bracket-container {
      position: relative;
      display: flex;
      flex-direction: row;
      gap: 32px;
      min-width: max-content;
      height: ${bracketHeight}px;
    }
    .round-col {
      width: 260px;
      position: relative;
      flex-shrink: 0;
    }
    .round-header {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 12px;
    }
    .round-header h5 {
      margin: 0;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .matchup {
      position: absolute;
      width: 240px;
      left: 10px;
    }
    .match-meta {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 3px;
      text-transform: uppercase;
    }
    .match-box {
      position: relative;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      padding: 4px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .participant-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      background: #f8fafc;
      border-radius: 5px;
      font-size: 11px;
      position: relative;
    }
    .participant-row.bye-row {
      background: #f1f5f9;
      border: 1px dashed #cbd5e1;
      opacity: 0.75;
    }
    .p-accent.bye-accent {
      background: #94a3b8;
    }
    .p-name.bye-name {
      color: #64748b;
      font-style: italic;
    }
    .p-accent {
      width: 3px;
      height: 14px;
      background: #10b981;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .p-name {
      font-weight: 700;
      color: #1e293b;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .p-flat {
      font-size: 9px;
      color: #64748b;
    }
    .court-tag {
      font-size: 9px;
      color: #4f46e5;
      font-weight: 600;
      margin-top: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .connector {
      position: absolute;
      left: -16px;
      top: 50%;
      border-left: 2px solid #818cf8;
      pointer-events: none;
    }
    .merger-right {
      position: absolute;
      right: -16px;
      bottom: 50%;
      width: 16px;
      border-bottom: 2px solid #818cf8;
      pointer-events: none;
    }
    .merger-left {
      position: absolute;
      left: -16px;
      bottom: 50%;
      width: 16px;
      border-bottom: 2px solid #818cf8;
      pointer-events: none;
    }
    .results-col {
      width: 220px;
    }
    .results-header {
      background: #fef3c7;
      border-color: #fde68a;
    }
    .results-header h5 {
      color: #92400e;
    }
    .results-box {
      position: absolute;
      width: 200px;
      left: 10px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }
    .winner-box, .runnerup-box {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 10px;
      padding: 12px;
    }
    .winner-box {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .trophy-icon, .medal-icon {
      font-size: 24px;
      margin-bottom: 4px;
    }
    .podium-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #92400e;
      letter-spacing: 0.5px;
    }
    .podium-name {
      font-size: 12px;
      font-weight: 700;
      color: #1e1b4b;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="top-bar no-print">
    <div>
      <h1 class="brand-title">🏆 ${escapeHtml(title)}</h1>
      <div class="sub-title">${escapeHtml(communityName)} · Official ${escapeHtml(sportName)} Knockout Draw & Bracket</div>
    </div>
    <div style="display:flex; gap:10px;">
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-print" style="background:#64748b;" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="bracket-wrapper">
    <div class="bracket-container">
      ${columnsHtml}
      ${podiumHtml}
    </div>
  </div>

  ${thirdPlaceHtml}
</body>
</html>`;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}

// ─── 4. Tournament Players & Payment Hub Exports ─────────────────────────────

export interface TournamentExportStats {
  total?: number;
  flats?: number;
  paid?: number;
  unpaid?: number;
  totalCollected?: number;
}

function checkIsHead(p: UniqueTournamentPlayer): boolean {
  if (p.familyMemberId) return false;
  if (!p.relation) return true;
  const rel = p.relation.trim().toUpperCase();
  return [
    "SELF",
    "PRIMARY",
    "HEAD",
    "RESIDENT",
    "OWNER",
    "TENANT",
    "PRIMARY RESIDENT",
    "HOUSEHOLD HEAD",
  ].includes(rel);
}

/**
 * Export tournament players and payments to CSV.
 * Supports:
 * - "roster": 1 row per unique player with all household, event summary, and payment details
 * - "events": 1 row per event registration, expanding each player's events with partner details
 */
export function exportTournamentPaymentsToCSV(
  players: UniqueTournamentPlayer[],
  tournamentName = "Tournament_Payment_Roster",
  mode: "roster" | "events" = "roster"
) {
  if (!players || players.length === 0) return;

  let headers: string[];
  let rows: string[];

  if (mode === "events") {
    headers = [
      "S.No",
      "Flat / Unit No",
      "Player Name",
      "Household Role",
      "Relation",
      "Participant Type",
      "Phone",
      "Email",
      "Sport",
      "Event Name",
      "Category",
      "Match Format",
      "Role in Event",
      "Partner Name",
      "Partner Phone",
      "Partner Confirmation Status",
      "Payment Status",
      "Fee Amount (INR)",
      "Payment Mode",
      "Transaction Ref",
      "Paid Date",
      "Collected By",
      "Collector Contact",
      "Payment Notes",
    ];

    rows = [];
    let rowIdx = 1;
    for (const p of players) {
      const flat = p.flatNumber || "—";
      const isHead = checkIsHead(p);
      const roleLabel = isHead ? "Head of Household" : "Family Member";
      const relLabel = p.relation || (isHead ? "Primary Resident" : "Family Member");
      const pType = p.isPartnerOnly ? "Doubles Partner Only" : "Primary Participant";
      const pPhone = p.phone || "—";
      const pEmail = p.email || "—";
      const payStatus = p.paymentStatus || "UNPAID";
      const amount = p.payment?.amount != null ? p.payment.amount : payStatus === "PAID" ? "—" : 0;
      const payMode = p.payment?.paymentMode || "—";
      const txRef = p.payment?.transactionRef || "—";
      const paidDate = p.payment?.paidAt ? format(new Date(p.payment.paidAt), "yyyy-MM-dd HH:mm") : "—";
      const collectedBy = p.payment?.collectedByName || p.payment?.markedByUserName || "—";
      const collectorContact = p.payment?.collectedByContact || "—";
      const notes = p.payment?.notes || "—";

      if (!p.registeredEvents || p.registeredEvents.length === 0) {
        rows.push(
          [
            rowIdx++,
            escapeCSV(flat),
            escapeCSV(p.playerName),
            escapeCSV(roleLabel),
            escapeCSV(relLabel),
            escapeCSV(pType),
            escapeCSV(pPhone),
            escapeCSV(pEmail),
            escapeCSV("—"),
            escapeCSV("—"),
            escapeCSV("—"),
            escapeCSV("—"),
            escapeCSV("—"),
            escapeCSV("—"),
            escapeCSV("—"),
            escapeCSV("—"),
            escapeCSV(payStatus),
            escapeCSV(amount),
            escapeCSV(payMode),
            escapeCSV(txRef),
            escapeCSV(paidDate),
            escapeCSV(collectedBy),
            escapeCSV(collectorContact),
            escapeCSV(notes),
          ].join(",")
        );
      } else {
        for (const ev of p.registeredEvents) {
          const partnerRole = ev.isPartner ? "Nominated Partner" : "Primary Registrant";
          const partnerName = ev.partnerName || "—";
          const partnerPhone = ev.partnerPhone || "—";
          const partnerStatus = ev.partnerConfirmationStatus || (ev.partnerName ? "Invited" : "—");

          rows.push(
            [
              rowIdx++,
              escapeCSV(flat),
              escapeCSV(p.playerName),
              escapeCSV(roleLabel),
              escapeCSV(relLabel),
              escapeCSV(pType),
              escapeCSV(pPhone),
              escapeCSV(pEmail),
              escapeCSV(ev.sportName || "—"),
              escapeCSV(ev.eventName || "—"),
              escapeCSV(ev.categoryName || "—"),
              escapeCSV(ev.matchType || "—"),
              escapeCSV(partnerRole),
              escapeCSV(partnerName),
              escapeCSV(partnerPhone),
              escapeCSV(partnerStatus),
              escapeCSV(payStatus),
              escapeCSV(amount),
              escapeCSV(payMode),
              escapeCSV(txRef),
              escapeCSV(paidDate),
              escapeCSV(collectedBy),
              escapeCSV(collectorContact),
              escapeCSV(notes),
            ].join(",")
          );
        }
      }
    }
  } else {
    // Roster summary mode (1 row per unique participant)
    headers = [
      "S.No",
      "Flat / Unit No",
      "Household Role",
      "Relation",
      "Player Name",
      "Participant Type",
      "Phone",
      "Email",
      "Total Events",
      "Registered Events",
      "Sports",
      "Doubles Partners & Details",
      "Payment Status",
      "Fee Amount (INR)",
      "Payment Mode",
      "Transaction Ref / UPI ID",
      "Paid Date & Time",
      "Collected By",
      "Collector Contact",
      "Payment Notes",
    ];

    rows = players.map((p, idx) => {
      const flat = p.flatNumber || "—";
      const isHead = checkIsHead(p);
      const roleLabel = isHead ? "Head of Household" : "Family Member";
      const relLabel = p.relation || (isHead ? "Primary Resident" : "Family Member");
      const pType = p.isPartnerOnly ? "Doubles Partner Only" : "Primary Participant";
      const pPhone = p.phone || "—";
      const pEmail = p.email || "—";
      const totalEvents = p.registeredEvents?.length || 0;

      const eventsSummary =
        (p.registeredEvents || [])
          .map((e) => `${e.eventName}${e.categoryName ? ` [${e.categoryName}]` : ""}`)
          .join("; ") || "—";

      const sportsSummary =
        Array.from(new Set((p.registeredEvents || []).map((e) => e.sportName).filter(Boolean))).join(", ") || "—";

      const partnerSummary =
        (p.registeredEvents || [])
          .filter((e) => e.partnerName)
          .map(
            (e) =>
              `${e.eventName}: ${e.partnerName} (${e.partnerConfirmationStatus || "Invited"}${
                e.partnerPhone ? ` · ${e.partnerPhone}` : ""
              })`
          )
          .join("; ") || "—";

      const payStatus = p.paymentStatus || "UNPAID";
      const amount = p.payment?.amount != null ? p.payment.amount : payStatus === "PAID" ? "—" : 0;
      const payMode = p.payment?.paymentMode || "—";
      const txRef = p.payment?.transactionRef || "—";
      const paidDate = p.payment?.paidAt ? format(new Date(p.payment.paidAt), "yyyy-MM-dd HH:mm") : "—";
      const collectedBy = p.payment?.collectedByName || p.payment?.markedByUserName || "—";
      const collectorContact = p.payment?.collectedByContact || "—";
      const notes = p.payment?.notes || "—";

      return [
        idx + 1,
        escapeCSV(flat),
        escapeCSV(roleLabel),
        escapeCSV(relLabel),
        escapeCSV(p.playerName),
        escapeCSV(pType),
        escapeCSV(pPhone),
        escapeCSV(pEmail),
        escapeCSV(totalEvents),
        escapeCSV(eventsSummary),
        escapeCSV(sportsSummary),
        escapeCSV(partnerSummary),
        escapeCSV(payStatus),
        escapeCSV(amount),
        escapeCSV(payMode),
        escapeCSV(txRef),
        escapeCSV(paidDate),
        escapeCSV(collectedBy),
        escapeCSV(collectorContact),
        escapeCSV(notes),
      ].join(",");
    });
  }

  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const sanitizedTitle = (tournamentName || "Tournament_Payments").replace(/[^a-zA-Z0-9_-]/g, "_");
  const suffix = mode === "events" ? "Detailed_Events" : "Roster_Payments";
  triggerDownload(csv, `${sanitizedTitle}_${suffix}_${format(new Date(), "yyyyMMdd_HHmm")}.csv`, "text/csv;charset=utf-8;");
}

/**
 * Export tournament players and payments to formatted Excel spreadsheet (.xls).
 * Includes summary metadata, Table 1 (Participant Roster & Payments Summary), and Table 2 (Event-by-Event Breakdown).
 */
export function exportTournamentPaymentsToExcel(
  players: UniqueTournamentPlayer[],
  tournamentName = "Tournament_Payment_Roster",
  stats?: TournamentExportStats
) {
  if (!players || players.length === 0) return;

  const total = stats?.total ?? players.length;
  const flats = stats?.flats ?? new Set(players.map((p) => p.flatNumber).filter(Boolean)).size;
  const paid = stats?.paid ?? players.filter((p) => p.paymentStatus === "PAID").length;
  const unpaid = stats?.unpaid ?? players.filter((p) => p.paymentStatus !== "PAID").length;
  const totalCollected = stats?.totalCollected ?? players.reduce((sum, p) => sum + (p.payment?.amount || 0), 0);

  const rosterHeaders = [
    "S.No",
    "Flat / Unit No",
    "Household Role",
    "Relation",
    "Player Name",
    "Participant Type",
    "Phone Number",
    "Email",
    "Events Count",
    "Registered Events",
    "Sports",
    "Doubles Partner(s)",
    "Payment Status",
    "Fee Amount (INR)",
    "Payment Mode",
    "Transaction Ref",
    "Paid Date & Time",
    "Collected By",
    "Collector Contact",
    "Notes",
  ];

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Tournament Roster &amp; Payments</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; }
  th { background-color: #4338ca; color: #ffffff; font-weight: bold; text-align: left; padding: 8px 10px; border: 1px solid #c7d2fe; font-size: 10pt; }
  td { padding: 6px 10px; border: 1px solid #e2e8f0; font-size: 10pt; vertical-align: middle; }
  .title-banner { font-size: 16pt; font-weight: bold; color: #1e1b4b; background-color: #eef2ff; padding: 12px; border: 1px solid #c7d2fe; }
  .summary-banner { font-size: 10pt; background-color: #f8fafc; color: #334155; padding: 8px; border: 1px solid #e2e8f0; }
  .badge-paid { background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center; }
  .badge-unpaid { background-color: #fef3c7; color: #b45309; font-weight: bold; text-align: center; }
  .badge-waived { background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: center; }
  .section-header { font-size: 12pt; font-weight: bold; color: #312e81; background-color: #e0e7ff; padding: 8px; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
</style>
</head>
<body>
<table>
  <tr><td colspan="20" class="title-banner">${escapeHtml(tournamentName)} — Participant Roster &amp; Payment Hub</td></tr>
  <tr><td colspan="20" class="summary-banner">
    <b>Generated On:</b> ${format(new Date(), "MMMM d, yyyy h:mm a")} &nbsp;|&nbsp;
    <b>Total Registered:</b> ${total} Players &nbsp;|&nbsp;
    <b>Registered Flats:</b> ${flats} Flats &nbsp;|&nbsp;
    <b>Paid:</b> ${paid} &nbsp;|&nbsp;
    <b>Unpaid:</b> ${unpaid} &nbsp;|&nbsp;
    <b>Total Collected:</b> INR ${totalCollected.toLocaleString("en-IN")}
  </td></tr>
  <tr></tr>
  <tr><td colspan="20" class="section-header">1. PARTICIPANT ROSTER &amp; PAYMENT STATUS (Summary)</td></tr>
  <tr>${rosterHeaders.map((h) => `<th>${h}</th>`).join("")}</tr>`;

  players.forEach((p, idx) => {
    const flat = p.flatNumber || "—";
    const isHead = checkIsHead(p);
    const roleLabel = isHead ? "Head of Household" : "Family Member";
    const relLabel = p.relation || (isHead ? "Primary Resident" : "Family Member");
    const pType = p.isPartnerOnly ? "Doubles Partner Only" : "Primary Participant";
    const pPhone = p.phone || "—";
    const pEmail = p.email || "—";
    const totalEvents = p.registeredEvents?.length || 0;

    const eventsSummary = (p.registeredEvents || [])
      .map((e) => `${escapeHtml(e.eventName)}${e.categoryName ? ` [${escapeHtml(e.categoryName)}]` : ""}`)
      .join("<br/>") || "—";

    const sportsSummary = Array.from(
      new Set((p.registeredEvents || []).map((e) => e.sportName).filter(Boolean))
    ).map((s) => escapeHtml(s!)).join(", ") || "—";

    const partnerSummary = (p.registeredEvents || [])
      .filter((e) => e.partnerName)
      .map((e) => `<b>${escapeHtml(e.eventName)}:</b> ${escapeHtml(e.partnerName!)} (${escapeHtml(e.partnerConfirmationStatus || "Invited")}${e.partnerPhone ? ` · ${escapeHtml(e.partnerPhone)}` : ""})`)
      .join("<br/>") || "—";

    const payStatus = p.paymentStatus || "UNPAID";
    const badgeClass = payStatus === "PAID" ? "badge-paid" : payStatus === "WAIVED" ? "badge-waived" : "badge-unpaid";
    const amount = p.payment?.amount != null ? `INR ${p.payment.amount}` : payStatus === "PAID" ? "—" : "INR 0";
    const payMode = p.payment?.paymentMode || "—";
    const txRef = p.payment?.transactionRef || "—";
    const paidDate = p.payment?.paidAt ? format(new Date(p.payment.paidAt), "yyyy-MM-dd HH:mm") : "—";
    const collectedBy = p.payment?.collectedByName || p.payment?.markedByUserName || "—";
    const collectorContact = p.payment?.collectedByContact || "—";
    const notes = p.payment?.notes || "—";

    html += `<tr>
      <td class="text-center">${idx + 1}</td>
      <td><b>${escapeHtml(flat)}</b></td>
      <td>${escapeHtml(roleLabel)}</td>
      <td>${escapeHtml(relLabel)}</td>
      <td><b>${escapeHtml(p.playerName)}</b></td>
      <td>${escapeHtml(pType)}</td>
      <td>${escapeHtml(pPhone)}</td>
      <td>${escapeHtml(pEmail)}</td>
      <td class="text-center">${totalEvents}</td>
      <td>${eventsSummary}</td>
      <td>${sportsSummary}</td>
      <td>${partnerSummary}</td>
      <td class="${badgeClass}">${escapeHtml(payStatus)}</td>
      <td class="text-right">${amount}</td>
      <td>${escapeHtml(payMode)}</td>
      <td>${escapeHtml(txRef)}</td>
      <td>${escapeHtml(paidDate)}</td>
      <td>${escapeHtml(collectedBy)}</td>
      <td>${escapeHtml(collectorContact)}</td>
      <td>${escapeHtml(notes)}</td>
    </tr>`;
  });

  // Table 2: Detailed Event Breakdown
  html += `<tr></tr>
  <tr><td colspan="20" class="section-header">2. DETAILED EVENT-BY-EVENT REGISTRATIONS (Check-In Sheet)</td></tr>
  <tr>
    <th>S.No</th>
    <th>Flat No</th>
    <th>Player Name</th>
    <th>Relation</th>
    <th>Sport</th>
    <th>Event Name</th>
    <th>Category</th>
    <th>Match Format</th>
    <th>Role in Event</th>
    <th>Partner Name</th>
    <th>Partner Phone</th>
    <th>Partner Status</th>
    <th>Payment Status</th>
    <th>Fee Amount</th>
    <th>Payment Mode</th>
    <th>Transaction Ref</th>
    <th>Paid Date</th>
    <th colspan="3">Notes</th>
  </tr>`;

  let eventRowIdx = 1;
  players.forEach((p) => {
    const flat = p.flatNumber || "—";
    const relLabel = p.relation || (checkIsHead(p) ? "Primary Resident" : "Family Member");
    const payStatus = p.paymentStatus || "UNPAID";
    const badgeClass = payStatus === "PAID" ? "badge-paid" : payStatus === "WAIVED" ? "badge-waived" : "badge-unpaid";
    const amount = p.payment?.amount != null ? `INR ${p.payment.amount}` : payStatus === "PAID" ? "—" : "INR 0";
    const payMode = p.payment?.paymentMode || "—";
    const txRef = p.payment?.transactionRef || "—";
    const paidDate = p.payment?.paidAt ? format(new Date(p.payment.paidAt), "yyyy-MM-dd HH:mm") : "—";
    const notes = p.payment?.notes || "—";

    (p.registeredEvents || []).forEach((ev) => {
      const partnerRole = ev.isPartner ? "Nominated Partner" : "Primary Registrant";
      const partnerName = ev.partnerName || "—";
      const partnerPhone = ev.partnerPhone || "—";
      const partnerStatus = ev.partnerConfirmationStatus || (ev.partnerName ? "Invited" : "—");

      html += `<tr>
        <td class="text-center">${eventRowIdx++}</td>
        <td><b>${escapeHtml(flat)}</b></td>
        <td><b>${escapeHtml(p.playerName)}</b></td>
        <td>${escapeHtml(relLabel)}</td>
        <td>${escapeHtml(ev.sportName || "—")}</td>
        <td>${escapeHtml(ev.eventName || "—")}</td>
        <td>${escapeHtml(ev.categoryName || "—")}</td>
        <td>${escapeHtml(ev.matchType || "—")}</td>
        <td>${escapeHtml(partnerRole)}</td>
        <td>${escapeHtml(partnerName)}</td>
        <td>${escapeHtml(partnerPhone)}</td>
        <td>${escapeHtml(partnerStatus)}</td>
        <td class="${badgeClass}">${escapeHtml(payStatus)}</td>
        <td class="text-right">${amount}</td>
        <td>${escapeHtml(payMode)}</td>
        <td>${escapeHtml(txRef)}</td>
        <td>${escapeHtml(paidDate)}</td>
        <td colspan="3">${escapeHtml(notes)}</td>
      </tr>`;
    });
  });

  html += `</table></body></html>`;

  const sanitizedTitle = (tournamentName || "Tournament_Payments").replace(/[^a-zA-Z0-9_-]/g, "_");
  triggerDownload(html, `${sanitizedTitle}_Complete_Details_${format(new Date(), "yyyyMMdd_HHmm")}.xls`, "application/vnd.ms-excel");
}

/**
 * Print / Save PDF formatted Tournament Participant & Payment Roster
 */
export function exportTournamentPaymentsToPDF(
  players: UniqueTournamentPlayer[],
  tournamentName = "Tournament_Payment_Roster",
  stats?: TournamentExportStats,
  communityName = "Mana Community"
) {
  if (!players || players.length === 0) return;

  const total = stats?.total ?? players.length;
  const flats = stats?.flats ?? new Set(players.map((p) => p.flatNumber).filter(Boolean)).size;
  const paid = stats?.paid ?? players.filter((p) => p.paymentStatus === "PAID").length;
  const unpaid = stats?.unpaid ?? players.filter((p) => p.paymentStatus !== "PAID").length;
  const totalCollected = stats?.totalCollected ?? players.reduce((sum, p) => sum + (p.payment?.amount || 0), 0);

  const printWindow = window.open("", "_blank", "width=1000,height=800");
  if (!printWindow) {
    alert("Please allow popups to print/export PDF roster.");
    return;
  }

  const rowsHtml = players
    .map((p, idx) => {
      const flat = p.flatNumber || "—";
      const isHead = checkIsHead(p);
      const relLabel = p.relation || (isHead ? "Head" : "Family");
      const pPhone = p.phone || "—";
      const payStatus = p.paymentStatus || "UNPAID";
      const isPaid = payStatus === "PAID";
      const statusClass = isPaid ? "status-paid" : payStatus === "WAIVED" ? "status-waived" : "status-unpaid";
      const amount = p.payment?.amount != null ? `₹${p.payment.amount}` : isPaid ? "—" : "₹0";
      const payMode = p.payment?.paymentMode || "—";
      const txRef = p.payment?.transactionRef || "";
      const collectedBy = p.payment?.collectedByName || p.payment?.markedByUserName || "—";

      const eventsSummary = (p.registeredEvents || [])
        .map((e) => {
          const partnerText = e.partnerName ? ` (w/ ${escapeHtml(e.partnerName)})` : "";
          return `• ${escapeHtml(e.eventName)}${partnerText}`;
        })
        .join("<br/>") || "—";

      return `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><b>${escapeHtml(flat)}</b></td>
        <td>
          <div style="font-weight:bold; color:#0f172a;">${escapeHtml(p.playerName)}</div>
          <div style="font-size:10px; color:#64748b;">${escapeHtml(relLabel)}${p.isPartnerOnly ? " · Partner Only" : ""}</div>
        </td>
        <td>${escapeHtml(pPhone)}</td>
        <td style="font-size:11px;">${eventsSummary}</td>
        <td style="text-align:center;"><span class="badge ${statusClass}">${escapeHtml(payStatus)}</span></td>
        <td style="text-align:right; font-weight:bold;">${amount}</td>
        <td style="font-size:10px;">
          <div>${escapeHtml(payMode)}</div>
          ${txRef ? `<div style="color:#64748b;">${escapeHtml(txRef)}</div>` : ""}
        </td>
        <td style="font-size:10px; color:#475569;">${escapeHtml(collectedBy)}</td>
      </tr>`;
    })
    .join("");

  const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(tournamentName)} — Participant Roster</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 20px; color: #1e293b; font-size: 11px; }
    .no-print { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
    .header { margin-bottom: 16px; }
    .header h1 { font-size: 18px; margin: 0 0 4px 0; color: #0f172a; }
    .header p { margin: 0; font-size: 11px; color: #64748b; }
    .stats-row { display: flex; gap: 12px; margin-bottom: 16px; }
    .stat-badge { padding: 6px 12px; background: #f1f5f9; border-radius: 6px; font-size: 11px; border: 1px solid #e2e8f0; }
    .stat-badge b { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #4338ca; color: white; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background-color: #f8fafc; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; text-transform: uppercase; }
    .status-paid { background: #dcfce7; color: #15803d; }
    .status-unpaid { background: #fef3c7; color: #b45309; }
    .status-waived { background: #f1f5f9; color: #475569; }
    .btn-print { background: #4338ca; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; }
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; }
      th { background-color: #e2e8f0 !important; color: #0f172a !important; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <b>Print Preview:</b> ${escapeHtml(tournamentName)} (${players.length} participants)
    </div>
    <div style="display:flex; gap:8px;">
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-print" style="background:#64748b;" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="header">
    <h1>🏆 ${escapeHtml(tournamentName)} — Participant Roster &amp; Payment Hub</h1>
    <p>${escapeHtml(communityName)} · Official Tournament Participant List · Generated on ${format(new Date(), "MMMM d, yyyy h:mm a")}</p>
  </div>

  <div class="stats-row">
    <div class="stat-badge">Total Registered: <b>${total} Players</b></div>
    <div class="stat-badge">Flats: <b>${flats} Flats</b></div>
    <div class="stat-badge">Paid: <b style="color:#15803d;">${paid}</b></div>
    <div class="stat-badge">Unpaid: <b style="color:#b45309;">${unpaid}</b></div>
    <div class="stat-badge">Total Fees Collected: <b style="color:#4338ca;">₹${totalCollected.toLocaleString("en-IN")}</b></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:25px;">#</th>
        <th style="width:60px;">Flat</th>
        <th>Player</th>
        <th style="width:90px;">Phone</th>
        <th>Registered Events &amp; Partners</th>
        <th style="width:65px; text-align:center;">Payment</th>
        <th style="width:60px; text-align:right;">Amount</th>
        <th style="width:80px;">Mode / Ref</th>
        <th style="width:90px;">Collected By</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}

