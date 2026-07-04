export const LEDGER_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
.ledger-app{
  /* Figma AI "Sports Scheduler" palette: lavender surfaces, indigo primary,
     dark-indigo sidebar/hero, violet accents. */
  --bg:#f0f4ff; --bg-deep:#4f46e5; --bg-deep-2:#4338ca; --ink:#0d0d2b; --line:#dfe4f5;
  --income:#4f46e5; --income-soft:#eef2ff; --expense:#dc2626; --expense-soft:#fee2e2;
  --gold:#8b5cf6; --card:#ffffff; --muted:#6b7094; --muted-2:#8b8fc8; --radius:12px;
  color:var(--ink); font-family:'Plus Jakarta Sans','Inter',sans-serif; -webkit-font-smoothing:antialiased;
}
.ledger-app *{box-sizing:border-box;}
.ledger-app .app{display:flex; min-height:100vh; margin:-1rem;}
.ledger-app .sidebar{width:250px; flex-shrink:0; background:linear-gradient(rgb(30, 27, 75) 0%, rgb(22, 20, 74) 60%, rgb(18, 16, 61) 100%); color:#DCE5DD; padding:22px 14px 24px; position:sticky; top:0; height:100vh; overflow-y:auto;}
.ledger-app .brand{display:flex; align-items:center; gap:10px; padding:6px 10px 20px; border-bottom:1px dashed rgba(255,255,255,0.16); margin-bottom:14px;}
.ledger-app .brand-mark{width:30px; height:30px; border-radius:8px; background:rgba(245,158,11,0.18); border:1px solid rgba(245,158,11,0.4); display:flex; align-items:center; justify-content:center; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; color:#f59e0b; flex-shrink:0;}
.ledger-app .brand-name{font-family:'Plus Jakarta Sans',sans-serif; font-size:16px; color:#f8fafc; letter-spacing:-0.01em;}
.ledger-app .brand-sub{font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:.14em; text-transform:uppercase; color:#94a3b8; margin-top:1px;}
.ledger-app nav.menu{display:flex; flex-direction:column; gap:2px;}
.ledger-app .nav-link,.ledger-app .nav-group-toggle{display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:8px; font-size:13.5px; color:#94a3b8; text-decoration:none; cursor:pointer; border:none; background:transparent; width:100%; text-align:left; font-family:'Plus Jakarta Sans',sans-serif;}
.ledger-app .nav-link:hover,.ledger-app .nav-group-toggle:hover{background:rgba(255,255,255,0.06); color:#f8fafc;}
.ledger-app .nav-link.active{background:rgba(129,140,248,0.20); color:#f8fafc;}
.ledger-app .nav-icon{width:15px; height:15px; flex-shrink:0; opacity:.85;}
.ledger-app .nav-group{margin-top:2px;}
.ledger-app .nav-group-toggle .chev{margin-left:auto; transition:transform .18s ease; opacity:.7;}
.ledger-app .nav-group.open .chev{transform:rotate(90deg);}
.ledger-app .nav-children{display:flex; flex-direction:column; gap:1px; max-height:0; overflow:hidden; transition:max-height .22s ease; padding-left:14px; margin-left:14px; border-left:1px dashed rgba(255,255,255,0.16);}
.ledger-app .nav-group.open .nav-children{max-height:400px;}
.ledger-app .nav-children .nav-link{font-size:13px; padding:7px 10px; color:#94a3b8;}
.ledger-app .nav-children .nav-link:hover{color:#f8fafc;}
.ledger-app .sidebar-foot{margin-top:22px; padding-top:14px; border-top:1px dashed rgba(255,255,255,0.16); font-family:'JetBrains Mono',monospace; font-size:10.5px; color:#64748b; letter-spacing:.04em; padding-left:10px;}
.ledger-app .menu-toggle{display:none; position:fixed; top:16px; left:16px; z-index:40; width:38px; height:38px; border-radius:9px; background:var(--bg-deep); border:none; align-items:center; justify-content:center; cursor:pointer;}
.ledger-app .menu-toggle svg{width:17px; height:17px;}
.ledger-app .scrim{display:none;}
.ledger-app .main{flex:1; min-width:0; background:var(--bg); background-image:linear-gradient(var(--line) 1px, transparent 1px); background-size:100% 34px; padding:32px 32px 80px;}
@media (max-width:960px){
  .ledger-app .sidebar{position:fixed; left:0; top:0; z-index:50; transform:translateX(-100%); transition:transform .22s ease; box-shadow:8px 0 30px rgba(0,0,0,0.25);}
  .ledger-app .sidebar.open{transform:translateX(0);}
  .ledger-app .menu-toggle{display:flex;}
  .ledger-app .scrim.show{display:block; position:fixed; inset:0; background:rgba(15,23,42,0.4); z-index:45;}
  .ledger-app .main{padding:76px 18px 60px;}
}
.ledger-app .wrap{max-width:1180px; margin:0 auto;}
.ledger-app .masthead{display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-bottom:26px; flex-wrap:wrap;}
.ledger-app .masthead-actions{display:flex; align-items:center; gap:12px; flex-wrap:wrap;}
.ledger-app .masthead-eyebrow{font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted-2); margin:0 0 6px;}
.ledger-app .masthead h1{font-family:'Plus Jakarta Sans',sans-serif; font-weight:500; font-size:32px; margin:0; letter-spacing:-0.01em;}
.ledger-app .masthead-desc{margin:8px 0 0; font-size:14px; color:var(--muted);}
.ledger-app .tabs{display:flex; background:var(--card); border:1px solid var(--line); border-radius:999px; padding:4px; gap:2px;}
.ledger-app .tab{font-family:'JetBrains Mono',monospace; font-size:12px; letter-spacing:.03em; padding:9px 16px; border-radius:999px; color:var(--muted); cursor:pointer; border:none; background:transparent; transition:.15s ease; white-space:nowrap;}
.ledger-app .tab.active{background:var(--bg-deep); color:#f8fafc;}
.ledger-app .tab:not(.active):hover{color:var(--ink);}
.ledger-app .hero{position:relative; background:linear-gradient(165deg,var(--bg-deep),var(--bg-deep-2)); border-radius:20px; padding:34px 34px 28px; color:#f8fafc; overflow:hidden; margin-bottom:22px;}
.ledger-app .hero::before{content:""; position:absolute; inset:0; background-image:repeating-linear-gradient(rgba(255,255,255,0.05) 0 1px, transparent 1px 34px); pointer-events:none;}
.ledger-app .hero-top{display:flex; justify-content:space-between; align-items:flex-start; gap:20px; flex-wrap:wrap; position:relative; z-index:1;}
.ledger-app .hero-label{font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#cbd5e1; margin:0 0 10px;}
.ledger-app .hero-figures{display:flex; gap:44px; flex-wrap:wrap;}
.ledger-app .figure dt{font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:#94a3b8; margin-bottom:8px;}
.ledger-app .figure dd{margin:0; font-family:'Plus Jakarta Sans',sans-serif; font-size:34px; font-weight:500; letter-spacing:-0.01em;}
.ledger-app .figure.income dd{color:#34d399;}
.ledger-app .figure.expense dd{color:#f87171;}
.ledger-app .figure .cur{font-size:15px; font-family:'JetBrains Mono',monospace; opacity:.7; margin-right:4px; vertical-align:2px;}
.ledger-app .stamp{position:relative; z-index:1; width:104px; height:104px; border-radius:50%; border:1.5px dashed rgba(245,158,11,0.55); display:flex; align-items:center; justify-content:center; text-align:center; transform:rotate(-8deg); flex-shrink:0;}
.ledger-app .stamp-inner{font-family:'JetBrains Mono',monospace; color:#f59e0b; line-height:1.3;}
.ledger-app .stamp-inner .amt{font-size:16px; font-weight:600; display:block;}
.ledger-app .stamp-inner .sub{font-size:9px; letter-spacing:.12em; text-transform:uppercase; opacity:.8;}
.ledger-app .hero-chart{position:relative; z-index:1; margin-top:26px; border-top:1px dashed rgba(255,255,255,0.18); padding-top:20px; display:flex; align-items:center; gap:18px; color:#94a3b8;}
.ledger-app .hero-chart svg{flex-shrink:0;}
.ledger-app .hero-chart p{margin:0; font-size:13.5px; line-height:1.55; color:#cbd5e1; max-width:420px;}
.ledger-app .hero-chart strong{color:#ffffff; font-weight:600;}
.ledger-app .grid{display:grid; grid-template-columns:1.15fr 1fr; gap:20px; margin-bottom:20px;}
@media (max-width:860px){ .ledger-app .grid{grid-template-columns:1fr;} }
.ledger-app .card{background:var(--card); border:1px solid var(--line); border-radius:var(--radius); padding:0; position:relative;}
.ledger-app .card-head{display:flex; justify-content:space-between; align-items:center; padding:20px 22px 14px;}
.ledger-app .card-head h2{font-family:'Plus Jakarta Sans',sans-serif; font-weight:500; font-size:17.5px; margin:0;}
.ledger-app .card-head .tag{font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted-2); border:1px solid var(--line); border-radius:999px; padding:3px 9px;}
.ledger-app .card-body{padding:2px 22px 22px;}
.ledger-app .empty{display:flex; flex-direction:column; align-items:flex-start; gap:6px; padding:20px 2px 8px; border-top:1px dashed var(--line); margin-top:6px;}
.ledger-app .empty .glyph{width:34px; height:34px; border-radius:9px; background:var(--bg); display:flex; align-items:center; justify-content:center; margin-bottom:6px;}
.ledger-app .empty h3{margin:0; font-size:14px; font-weight:600;}
.ledger-app .empty p{margin:0; font-size:13px; color:var(--muted); line-height:1.5;}
.ledger-app .activity-row{display:flex; gap:12px; padding:10px 0; border-top:1px dashed var(--line);}
.ledger-app .activity-row:first-child{border-top:none;}
.ledger-app .dot{width:7px; height:7px; border-radius:50%; background:var(--income); margin-top:6px; flex-shrink:0;}
.ledger-app .activity-row p{margin:0; font-size:13.5px; line-height:1.5;}
.ledger-app .activity-row .who{font-family:'JetBrains Mono',monospace; font-size:12.5px; color:var(--muted);}
.ledger-app .activity-row .when{font-size:11.5px; color:var(--muted-2); margin-top:3px;}
.ledger-app table{width:100%; border-collapse:collapse;}
.ledger-app td,.ledger-app th{text-align:left; padding:11px 0; font-size:13.5px;}
.ledger-app thead th{font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted-2); border-bottom:1px dashed var(--line); padding-bottom:9px;}
.ledger-app tbody tr{border-bottom:1px dashed var(--line);}
.ledger-app tbody tr:last-child{border-bottom:none;}
.ledger-app td.amount{font-family:'JetBrains Mono',monospace; text-align:right; color:var(--muted);}
.ledger-app td.acct{display:flex; align-items:center; gap:9px;}
.ledger-app .swatch{width:8px; height:8px; border-radius:2px; background:var(--gold); flex-shrink:0;}
.ledger-app .stat-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:22px;}
.ledger-app .stat-grid.cols-3{grid-template-columns:repeat(3,1fr);}
@media (max-width:920px){ .ledger-app .stat-grid{grid-template-columns:repeat(2,1fr);} }
@media (max-width:520px){ .ledger-app .stat-grid{grid-template-columns:1fr;} }
.ledger-app .stat-card{background:var(--card); border:1px solid var(--line); border-radius:var(--radius); padding:18px 20px 16px; position:relative; overflow:hidden;}
.ledger-app .stat-card::after{content:""; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--accent,var(--gold));}
.ledger-app .stat-card .stat-label{font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted-2); margin:0 0 10px;}
.ledger-app .stat-card .stat-amt{font-family:'Plus Jakarta Sans',sans-serif; font-weight:500; font-size:24px; margin:0; letter-spacing:-0.01em;}
.ledger-app .stat-card .stat-amt .cur{font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--muted-2); margin-right:4px; font-weight:400;}
.ledger-app .stat-card .stat-sub{margin:6px 0 0; font-size:12.5px; color:var(--muted);}
.ledger-app .stat-card.c-total{--accent:#8A968B;}
.ledger-app .stat-card.c-pending{--accent:var(--expense);}
.ledger-app .stat-card.c-collected{--accent:var(--income);}
.ledger-app .stat-card.c-settled{--accent:var(--gold);}
.ledger-app .search-row{display:flex; align-items:center; gap:9px; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:9px 13px; margin:0 22px 16px;}
.ledger-app .search-row svg{flex-shrink:0; opacity:.55;}
.ledger-app .search-row input{border:none; background:transparent; outline:none; font-family:'Plus Jakarta Sans',sans-serif; font-size:13.5px; color:var(--ink); width:100%;}
.ledger-app .search-row input::placeholder{color:var(--muted-2);}
.ledger-app .table-card .card-body{padding:0 0 8px;}
.ledger-app .table-scroll{overflow-x:auto; padding:0 22px;}
.ledger-app table.data{width:100%; border-collapse:collapse; min-width:720px;}
.ledger-app table.data thead th{font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:.07em; text-transform:uppercase; color:var(--muted-2); text-align:left; padding:0 10px 10px 0; border-bottom:1px dashed var(--line); white-space:nowrap;}
.ledger-app table.data thead th:last-child{text-align:right;}
.ledger-app table.data td{padding:14px 10px 14px 0; font-size:13.5px; border-bottom:1px dashed var(--line);}
.ledger-app .empty-table-row td{padding:44px 10px; text-align:center; color:var(--muted); font-size:13.5px; border-bottom:none;}
.ledger-app .empty-table-row .glyph{width:36px; height:36px; border-radius:10px; background:var(--bg); display:flex; align-items:center; justify-content:center; margin:0 auto 10px;}
.ledger-app .field{display:flex; flex-direction:column; gap:6px;}
.ledger-app .field label{font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted-2);}
.ledger-app .field input[type="text"],.ledger-app .field input[type="date"],.ledger-app .field input[type="number"],.ledger-app .field select,.ledger-app .field textarea{font-family:'Plus Jakarta Sans',sans-serif; font-size:13.5px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:9px; padding:10px 12px; outline:none; width:100%; transition:border-color .15s ease;}
.ledger-app .field input:focus,.ledger-app .field select:focus,.ledger-app .field textarea:focus{border-color:var(--gold);}
.ledger-app .field textarea{resize:vertical; min-height:78px;}
.ledger-app .form-card{background:var(--card); border:1px solid var(--line); border-radius:var(--radius); padding:24px 26px; margin-bottom:20px; position:relative;}
.ledger-app .form-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:18px 20px;}
@media (max-width:760px){ .ledger-app .form-grid{grid-template-columns:repeat(2,1fr) !important;} }
@media (max-width:520px){ .ledger-app .form-grid{grid-template-columns:1fr !important;} }
.ledger-app .section-title{font-family:'Plus Jakarta Sans',sans-serif; font-weight:500; font-size:16px; margin:0 0 16px;}
.ledger-app .item-table{width:100%; border-collapse:collapse; min-width:820px;}
.ledger-app .item-table thead th{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:.07em; text-transform:uppercase; color:var(--muted-2); text-align:left; padding:0 8px 10px 0; border-bottom:1px dashed var(--line); white-space:nowrap;}
.ledger-app .item-table td{padding:10px 8px 10px 0; border-bottom:1px dashed var(--line); vertical-align:top;}
.ledger-app .item-table td input,.ledger-app .item-table td select{font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; border:1px solid var(--line); border-radius:7px; padding:8px 9px; width:100%; outline:none; background:#fff;}
.ledger-app .item-table td input:focus,.ledger-app .item-table td select:focus{border-color:var(--gold);}
.ledger-app .item-table td.col-qty input,.ledger-app .item-table td.col-cost input,.ledger-app .item-table td.col-disc input{font-family:'JetBrains Mono',monospace; text-align:right;}
.ledger-app .item-table td.col-total{font-family:'JetBrains Mono',monospace; font-weight:600; text-align:right; padding-top:16px; white-space:nowrap;}
.ledger-app .item-table td.col-del{text-align:center; padding-top:14px;}
.ledger-app .row-del{width:26px; height:26px; border-radius:7px; border:1px solid var(--line); background:#fff; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; color:var(--expense); transition:.15s ease;}
.ledger-app .row-del:hover{background:var(--expense-soft); border-color:var(--expense);}
.ledger-app .disc-cell{display:flex; align-items:center; gap:5px;}
.ledger-app .disc-cell span{font-size:12px; color:var(--muted-2); font-family:'JetBrains Mono',monospace;}
.ledger-app .add-line{margin-top:14px; display:inline-flex; align-items:center; gap:7px; font-family:'JetBrains Mono',monospace; font-size:12.5px; letter-spacing:.03em; color:var(--income); background:var(--income-soft); border:1px dashed var(--income); border-radius:8px; padding:9px 14px; cursor:pointer;}
.ledger-app .add-line:hover{background:#D3EBDC;}
.ledger-app .totals-wrap{display:flex; justify-content:flex-end; margin-top:18px;}
.ledger-app .totals{width:100%; max-width:320px;}
.ledger-app .totals-row{display:flex; justify-content:space-between; padding:9px 0; border-top:1px dashed var(--line); font-size:13.5px;}
.ledger-app .totals-row:first-child{border-top:none;}
.ledger-app .totals-row .amt{font-family:'JetBrains Mono',monospace; color:var(--muted);}
.ledger-app .totals-row.grand{border-top:1px solid var(--ink); margin-top:4px; padding-top:12px;}
.ledger-app .totals-row.grand span:first-child{font-family:'Plus Jakarta Sans',sans-serif; font-size:15.5px; font-weight:500;}
.ledger-app .totals-row.grand .amt{font-family:'JetBrains Mono',monospace; font-size:16px; font-weight:600; color:var(--ink);}
.ledger-app .tax-toggle{display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 0; font-size:12.5px; color:var(--muted);}
.ledger-app .check-row{display:flex; align-items:center; gap:9px; margin-top:8px; font-size:13.5px; color:var(--ink); cursor:pointer;}
.ledger-app .check-row input[type="checkbox"]{width:17px; height:17px; accent-color:var(--income); cursor:pointer;}
.ledger-app .action-bar{display:flex; justify-content:flex-end; gap:10px; margin-top:24px; flex-wrap:wrap;}
.ledger-app .btn{font-family:'Plus Jakarta Sans',sans-serif; font-size:13.5px; font-weight:600; padding:11px 20px; border-radius:9px; cursor:pointer; border:1px solid transparent; transition:.15s ease;}
.ledger-app .btn-ghost{background:transparent; border-color:var(--line); color:var(--ink);}
.ledger-app .btn-ghost:hover{background:var(--card);}
.ledger-app .btn-outline{background:#fff; border-color:var(--bg-deep); color:var(--bg-deep);}
.ledger-app .btn-outline:hover{background:var(--bg);}
.ledger-app .btn-primary{background:var(--bg-deep); border-color:var(--bg-deep); color:#f8fafc;}
.ledger-app .btn-primary:hover{background:var(--bg-deep-2);}
.ledger-app .footnote{text-align:center; font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--muted-2); margin-top:30px; letter-spacing:.04em;}

/* ---------- Expenses: clickable stat cards ---------- */
.ledger-app .stat-card.clickable{cursor:pointer; transition:.15s ease;}
.ledger-app .stat-card.clickable:hover{border-color:var(--accent,var(--gold)); box-shadow:0 2px 10px rgba(18,38,31,0.06); transform:translateY(-1px);}
.ledger-app .stat-card.linkable{cursor:pointer; transition:.15s ease;}
.ledger-app .stat-card.linkable:hover{border-color:var(--accent,var(--gold)); box-shadow:0 2px 10px rgba(18,38,31,0.06);}

/* ---------- Expenses: filter toolbar ---------- */
.ledger-app .filter-bar{display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; padding:18px 22px 0;}
.ledger-app .filter-left{display:flex; align-items:center; gap:10px; flex-wrap:wrap;}
.ledger-app .filter-right{display:flex; align-items:center; gap:9px; flex-wrap:wrap;}
.ledger-app .filter-select{font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; font-weight:600; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:9px; padding:9px 30px 9px 12px; cursor:pointer; outline:none; appearance:none; -webkit-appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235C6B60' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; background-size:13px;}
.ledger-app .filter-select:focus{border-color:var(--gold);}
.ledger-app .results-count{font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--muted-2); white-space:nowrap;}
.ledger-app .filter-toggle{width:38px; height:38px; border-radius:9px; border:1px solid var(--line); background:#fff; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; color:var(--muted); transition:.15s ease; flex-shrink:0;}
.ledger-app .filter-toggle:hover, .ledger-app .filter-toggle.active{border-color:var(--gold); color:var(--ink); background:var(--income-soft);}
.ledger-app .adv-filters{display:none; margin:16px 22px 4px; padding:20px; border:1px dashed var(--line); border-radius:12px; background:var(--bg);}
.ledger-app .adv-filters.open{display:block;}
.ledger-app .adv-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:16px;}
@media (max-width:900px){ .ledger-app .adv-grid{grid-template-columns:repeat(2,1fr);} }
@media (max-width:520px){ .ledger-app .adv-grid{grid-template-columns:1fr;} }
.ledger-app .adv-field label{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:.07em; text-transform:uppercase; color:var(--muted-2); display:block; margin-bottom:7px;}
.ledger-app .adv-field select, .ledger-app .adv-field input{width:100%; font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:8px; padding:9px 11px; outline:none;}
.ledger-app .adv-field select:focus, .ledger-app .adv-field input:focus{border-color:var(--gold);}
.ledger-app .adv-range{display:flex; gap:8px;}
.ledger-app .adv-actions{display:flex; justify-content:center; gap:10px; margin-top:18px;}

/* ---------- Expenses: segmented toggle (Paid/Unpaid) ---------- */
.ledger-app .segmented{display:inline-flex; border:1px solid var(--line); border-radius:9px; overflow:hidden; background:#fff;}
.ledger-app .segmented label{display:flex; align-items:center; gap:6px; padding:9px 16px; font-size:13px; font-weight:600; color:var(--muted); cursor:pointer; transition:.15s ease; user-select:none;}
.ledger-app .segmented label:first-child{border-right:1px solid var(--line);}
.ledger-app .segmented input{display:none;}
.ledger-app .segmented label.checked{background:var(--income-soft); color:var(--income);}
.ledger-app .segmented label.checked.unpaid-checked{background:var(--expense-soft); color:var(--expense);}
.ledger-app .segmented svg{opacity:0; width:12px; height:12px; transition:.1s ease;}
.ledger-app .segmented label.checked svg{opacity:1;}
.ledger-app .readonly-field{display:flex; align-items:center; height:41px; padding:0 12px; font-family:'JetBrains Mono',monospace; font-size:13.5px; color:var(--muted); background:var(--bg); border:1px dashed var(--line); border-radius:9px;}

/* ---------- Expenses: file upload + tax breakdown ---------- */
.ledger-app .upload-row{display:flex; align-items:center; gap:14px; flex-wrap:wrap; padding:16px 18px; background:var(--bg); border:1px dashed var(--line); border-radius:12px;}
.ledger-app .upload-icon{width:36px; height:36px; border-radius:9px; background:var(--card); display:flex; align-items:center; justify-content:center; flex-shrink:0; color:var(--muted); border:1px solid var(--line);}
.ledger-app .upload-text strong{display:block; font-size:13.5px; color:var(--ink); margin-bottom:2px;}
.ledger-app .upload-text span{font-size:12px; color:var(--muted-2);}
.ledger-app .upload-row input[type="file"]{margin-left:auto; font-family:'Plus Jakarta Sans',sans-serif; font-size:12.5px; color:var(--muted); max-width:220px;}
.ledger-app .tax-breakdown{display:none; flex-direction:column; gap:2px; margin-top:2px;}
.ledger-app .tax-breakdown.show{display:flex;}
.ledger-app .tax-breakdown .tb-row{display:flex; justify-content:space-between; font-size:11.5px; font-family:'JetBrains Mono',monospace; color:var(--muted-2); padding:2px 2px;}
.ledger-app .conditional-field{display:none;}
.ledger-app .conditional-field.show{display:flex; flex-direction:column; gap:6px;}

/* ---------- Expenses: New Account modal ---------- */
.ledger-app .modal-overlay{display:none; position:fixed; inset:0; z-index:100; background:rgba(15,43,34,0.45); align-items:center; justify-content:center; padding:20px;}
.ledger-app .modal-overlay.open{display:flex;}
.ledger-app .modal-card{background:var(--card); border-radius:16px; width:100%; max-width:440px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(15,43,34,0.25); animation:ledgerModalIn .18s ease;}
@keyframes ledgerModalIn{from{opacity:0; transform:translateY(8px) scale(.98);} to{opacity:1; transform:translateY(0) scale(1);}}
.ledger-app .modal-head{display:flex; align-items:center; justify-content:space-between; gap:10px; padding:18px 20px; background:var(--bg); border-bottom:1px solid var(--line); border-radius:16px 16px 0 0;}
.ledger-app .modal-head h3{display:flex; align-items:center; gap:9px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:500; font-size:16.5px; margin:0; color:var(--ink);}
.ledger-app .modal-icon{width:30px; height:30px; border-radius:8px; background:var(--income-soft); color:var(--income); display:flex; align-items:center; justify-content:center; flex-shrink:0;}
.ledger-app .modal-close{width:30px; height:30px; border-radius:8px; border:1px solid var(--line); background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--muted); transition:.15s ease; flex-shrink:0;}
.ledger-app .modal-close:hover{border-color:var(--expense); color:var(--expense); background:var(--expense-soft);}
.ledger-app .modal-body{padding:20px 20px 6px; display:flex; flex-direction:column; gap:16px;}
.ledger-app .modal-footer{display:flex; justify-content:center; gap:10px; padding:18px 20px 22px;}

.ledger-app .view{animation:ledgerFadeIn .18s ease;}
@keyframes ledgerFadeIn{from{opacity:0; transform:translateY(4px);} to{opacity:1; transform:translateY(0);}}
`;
