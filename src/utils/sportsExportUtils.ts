import { format } from "date-fns";

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

    return [
      idx + 1,
      escapeCSV(pName),
      escapeCSV(cat),
      escapeCSV(flat),
      escapeCSV(age),
      escapeCSV(gender),
      escapeCSV(role),
      escapeCSV(relation),
      escapeCSV(status),
      escapeCSV(seed),
      escapeCSV(team),
      escapeCSV(regDate),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\r\n");
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
  <tr><td colspan="11" class="title-row">${title} — Registered Players Roster</td></tr>
  <tr><td colspan="11">Generated on: ${format(new Date(), "MMMM d, yyyy h:mm a")} | Total: ${players.length} Players</td></tr>
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

    html += `<tr>
      <td>${idx + 1}</td>
      <td><b>${pName}</b></td>
      <td>${cat}</td>
      <td>${flat}</td>
      <td>${age}</td>
      <td>${gender}</td>
      <td>${role}</td>
      <td>${relation}</td>
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
      (p, idx) => `
    <tr>
      <td style="text-align:center; font-weight:bold; color:#64748b;">${idx + 1}</td>
      <td style="font-weight:600; color:#0f172a;">${p.playerName || p.user?.fullName || "—"}</td>
      <td>${p.categoryName || p.category?.name || "—"}</td>
      <td style="font-weight:600;">${p.flatNumber || "—"}</td>
      <td>${p.age ?? "—"}</td>
      <td>${p.gender || p.category?.gender || "—"}</td>
      <td>${p.role || "—"}</td>
      <td style="text-align:center; font-weight:bold; color:#4f46e5;">${p.seed != null ? `#${p.seed}` : "—"}</td>
      <td><span class="badge ${p.status === "CONFIRMED" ? "badge-confirmed" : "badge-pending"}">${p.status || "CONFIRMED"}</span></td>
      <td style="border-bottom: 1px dotted #cbd5e1; width: 120px;"></td>
    </tr>`
    )
    .join("");

  const content = `
<!DOCTYPE html>
<html>
<head>
  <title>${title} — Player Roster</title>
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
      <h1>🏆 ${title}</h1>
      <div class="subtitle">${communityName} · Official Player Verification Roster</div>
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
    <div>${communityName} Sports Management Hub</div>
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
  roundName?: string;
  roundNumber?: number;
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
  homeScore?: number | string;
  awayScore?: number | string;
  status?: string;
  winnerName?: string;
  sportName?: string;
}

export function exportScheduleToCSV(matches: ExportableMatch[], title = "Tournament_Schedule") {
  const headers = [
    "Match #",
    "Round / Stage",
    "Sport",
    "Date",
    "Time",
    "Venue / Court",
    "Team 1 / Player 1",
    "Team 2 / Player 2",
    "Score",
    "Status",
    "Winner",
  ];

  const rows = matches.map((m, idx) => {
    const matchNum = m.matchNumber ?? (idx + 1);
    const round = m.name || m.roundName || m.stage || (m.roundNumber ? `Round ${m.roundNumber}` : "League Match");
    const sport = m.sport || m.sportName || "—";
    const mDate = m.date ? (typeof m.date === "string" ? m.date : format(m.date, "yyyy-MM-dd")) : "—";
    const mTime = m.time || m.scheduledTime || "—";
    const venue = m.venue || m.venueName || m.courtName || "Main Arena";
    const t1 = m.team1 || m.team1Name || m.homeTeamName || "TBD";
    const t2 = m.team2 || m.team2Name || m.awayTeamName || "TBD";
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
      escapeCSV(t2),
      escapeCSV(score),
      escapeCSV(status),
      escapeCSV(winner),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\r\n");
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  triggerDownload(csv, `${sanitizedTitle}_${format(new Date(), "yyyyMMdd")}.csv`, "text/csv;charset=utf-8;");
}

export function exportScheduleToExcel(matches: ExportableMatch[], title = "Tournament_Schedule") {
  const headers = [
    "Match #",
    "Stage / Round",
    "Sport",
    "Match Date",
    "Time",
    "Venue / Court",
    "Team 1 / Player 1",
    "Team 2 / Player 2",
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
</style>
</head>
<body>
<table>
  <tr><td colspan="11" class="title-row">${title} — Official Match Schedule & Fixtures</td></tr>
  <tr><td colspan="11">Generated on: ${format(new Date(), "MMMM d, yyyy h:mm a")} | Total Matches: ${matches.length}</td></tr>
  <tr></tr>
  <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;

  matches.forEach((m, idx) => {
    const matchNum = m.matchNumber ?? (idx + 1);
    const round = m.name || m.roundName || m.stage || (m.roundNumber ? `Round ${m.roundNumber}` : "League Match");
    const sport = m.sport || m.sportName || "—";
    const mDate = m.date ? (typeof m.date === "string" ? m.date : format(m.date, "yyyy-MM-dd")) : "—";
    const mTime = m.time || m.scheduledTime || "—";
    const venue = m.venue || m.venueName || m.courtName || "Main Arena";
    const t1 = m.team1 || m.team1Name || m.homeTeamName || "TBD";
    const t2 = m.team2 || m.team2Name || m.awayTeamName || "TBD";
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
      <td><b>${t2}</b></td>
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
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Please allow popups to print/export PDF");
    return;
  }

  const rowsHtml = matches
    .map((m, idx) => {
      const matchNum = m.matchNumber ?? (idx + 1);
      const round = m.name || m.roundName || m.stage || (m.roundNumber ? `Round ${m.roundNumber}` : "Match");
      const mDate = m.date ? (typeof m.date === "string" ? m.date : format(m.date, "dd-MMM-yyyy")) : "—";
      const mTime = m.time || m.scheduledTime || "—";
      const venue = m.venue || m.venueName || m.courtName || "Arena";
      const t1 = m.team1 || m.team1Name || m.homeTeamName || "TBD";
      const t2 = m.team2 || m.team2Name || m.awayTeamName || "TBD";
      const s1 = m.score1 ?? m.homeScore;
      const s2 = m.score2 ?? m.awayScore;
      const score = s1 != null && s2 != null && (s1 !== "" || s2 !== "") ? `${s1} : ${s2}` : "vs";

      return `
      <tr>
        <td style="text-align:center; font-weight:bold; color:#64748b;">#${matchNum}</td>
        <td style="font-weight:600; color:#4f46e5;">${round}</td>
        <td><b>${mDate}</b><br><span style="color:#64748b; font-size:10px;">${mTime}</span></td>
        <td>${venue}</td>
        <td style="text-align:right; font-weight:bold; font-size:12px;">${t1}</td>
        <td style="text-align:center; font-weight:bold; color:#e11d48; background:#fff1f2; padding:4px 8px; border-radius:4px;">${score}</td>
        <td style="text-align:left; font-weight:bold; font-size:12px;">${t2}</td>
        <td style="text-align:center;"><span class="badge badge-scheduled">${m.status || "SCHEDULED"}</span></td>
      </tr>`;
    })
    .join("");

  const content = `
<!DOCTYPE html>
<html>
<head>
  <title>${title} — Match Schedule</title>
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
      <h1>📅 ${title}</h1>
      <div class="subtitle">${communityName} · Official Tournament Schedule & Fixtures</div>
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
    <div>${communityName} Tournament Director</div>
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
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Please allow popups to print/export PDF");
    return;
  }

  const cardsHtml = matches
    .map((m, idx) => {
      const matchNum = m.matchNumber ?? (idx + 1);
      const round = m.name || m.roundName || m.stage || (m.roundNumber ? `Round ${m.roundNumber}` : "Match");
      const mDate = m.date ? (typeof m.date === "string" ? m.date : format(m.date, "dd-MMM-yyyy")) : "—";
      const mTime = m.time || m.scheduledTime || "—";
      const venue = m.venue || m.venueName || m.courtName || "Court 1";
      const t1 = m.team1 || m.team1Name || m.homeTeamName || "Team A";
      const t2 = m.team2 || m.team2Name || m.awayTeamName || "Team B";

      return `
      <div class="scorecard">
        <div class="scorecard-header">
          <div>
            <span class="badge">MATCH #${matchNum}</span>
            <span style="font-weight:bold; margin-left:8px; color:#4f46e5;">${round}</span>
          </div>
          <div style="font-size:10px; color:#64748b;">
            📅 ${mDate} at ${mTime} | 📍 ${venue}
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
              <td style="font-weight:bold; font-size:12px;">${t1}</td>
              <td></td><td></td><td></td><td></td><td>[ &nbsp; ]</td>
            </tr>
            <tr>
              <td style="font-weight:bold; font-size:12px;">${t2}</td>
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
  <title>${title} — Referee Scorecards</title>
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
  <h2 style="margin:0 0 12px 0; font-size:16px; text-transform:uppercase;">📝 Official Referee / Umpire Match Scorecards — ${title}</h2>
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
