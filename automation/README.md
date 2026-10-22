# Mana Community - AI Automation Workflow Engine (Self-Hosted n8n)

This directory contains the self-hosted automation infrastructure for the **Mana Community Application**. It provides zero-cost, event-driven AI workflows powered by **n8n** and free-tier LLMs (Google Gemini 1.5 Flash / Groq / Ollama).

---

## 🚀 Quick Start

You can run n8n in two ways:

### Option A: Direct via Node.js (Zero Docker Needed)
If you already have Node.js installed on your machine, you can launch n8n immediately:
```bash
npx n8n
```
Or install it globally:
```bash
npm install -g n8n
n8n start
```

### Option B: Via Docker
```bash
cd automation
docker compose up -d
```
Access the n8n Visual Automation Builder at: **`http://localhost:5678`**

---

## 📦 Pre-Built Workflows Included

The [`workflows/`](file:///d:/Application/applications/mana%20community/mana-community-app/automation/workflows) folder contains ready-to-import workflows:

| Workflow File | Trigger Type | AI Engine | Purpose |
| :--- | :--- | :--- | :--- |
| `ticket-triage.json` | Webhook (`POST /webhook/ticket-triage`) | Gemini 3.5 Flash Lite | Automatically analyzes helpdesk complaints, scores urgency (CRITICAL/HIGH/MED/LOW), selects the department (Plumbing, Electrical, Elevator), and suggests resolution actions. |
| `receipt-ocr-parser.json` | Webhook (`POST /webhook/receipt-parse`) | Gemini Multimodal | Parses uploaded vendor invoices/bills, extracts merchant name, date, invoice total, tax, and auto-categorizes for society treasurers. |
| `community-weekly-digest.json` | Scheduled Cron (Every Sunday 6 PM) | Gemini 3.5 Flash Lite | Reads active announcements, polls, and sports schedules to compose a weekly digest bulletin published to the notice board. |
| `sports-match-ai-recap.json` | Webhook (`POST /webhook/sports-match-recap`) | Gemini 3.5 Flash Lite | Analyzes concluded cricket/football/badminton scorecards, generates news headlines, dramatic recaps, key turning moments, MVP, badge recommendations, and WhatsApp bulletins. |
| `sports-fixture-ai-scheduler.json` | Webhook (`POST /webhook/sports-fixture-scheduler`) | Gemini 3.5 Flash Lite | Automatically generates optimal, conflict-free match schedules across available venues and time slots with rest balance. |

### How to Import a Workflow into n8n:
1. Open `http://localhost:5678` in your browser.
2. In the top-right corner, click **`...` (More options)** -> **Import from File**.
3. Select any `.json` file from `automation/workflows/`.
4. Click **Activate** (toggle top-right).

---

## 🧪 Testing Webhooks

### 1. Test Helpdesk Ticket Triage
```bash
curl -X POST http://localhost:5678/webhook/ticket-triage \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": 101,
    "title": "Water leaking from ceiling",
    "description": "Continuous water drip in Tower 3 Basement near EV charging station B4. Water pooling on electric conduits.",
    "category": "Plumbing",
    "location": "Tower 3, Basement 1"
  }'
```

**Expected AI Response:**
```json
{
  "status": "success",
  "ticketId": 101,
  "analysis": {
    "urgency": "CRITICAL",
    "assignedDepartment": "Plumbing",
    "suggestedAction": "Immediately isolate main basement supply valve and inspect ceiling conduits for electrical short-circuit risk.",
    "estimatedResolutionHours": 2,
    "safetyHazard": true
  }
}
```

### 2. Test Receipt Parser (JSON / Base64)
```bash
curl -X POST http://localhost:5678/webhook/receipt-parse \
  -H "Content-Type: application/json" \
  -d '{
    "expenseId": 502,
    "imageUrl": "https://example.com/receipt-sample.jpg"
  }'
```

### 3. Test Sports Match AI Recap & Badge Awards
```bash
curl -X POST http://localhost:5678/webhook/sports-match-recap \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": 204,
    "sport": "CRICKET",
    "tournamentName": "Mana Monsoon Trophy 2026",
    "teamA": "Titans",
    "teamB": "Strikers",
    "result": "Titans won by 3 runs",
    "scoreSummary": {
      "titans": "148/4 in 15 overs",
      "strikers": "145/7 in 15 overs"
    },
    "topPerformers": [
      { "playerName": "Rohan Sharma", "stats": "68 runs (34 balls) and 2 wickets" },
      { "playerName": "Vikram Patel", "stats": "52 runs (29 balls)" }
    ]
  }'
```

---

## 🔌 Connecting Mana React Frontend

Import and use the client helper inside [`src/services/automation/automationService.ts`](file:///d:/Application/applications/mana%20community/mana-community-app/src/services/automation/automationService.ts):

```typescript
import { automationService } from '@/services/automation/automationService';

// Automatically triage ticket during creation:
const triage = await automationService.triageTicket({
  ticketId: newTicket.id,
  title: newTicket.title,
  description: newTicket.description,
  category: newTicket.category,
  location: newTicket.location
});

console.log('AI Urgency:', triage.analysis.urgency);
```

---

## 🔒 Production Hardening Checklist

When deploying to a live society server:
- Set `WEBHOOK_URL=https://automation.yourdomain.com/` in `.env`.
- Place n8n behind Nginx reverse proxy with SSL (`certbot`).
- Enable webhook authentication checking using the `MANA_WEBHOOK_SECRET` header.
- For 100% offline environments, run **Ollama** alongside n8n using local open-weight models (`llama3.2`).
