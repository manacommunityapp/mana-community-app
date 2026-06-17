// CDP-based scan: for each route, full-reload navigate and count /api/* requests.
const CDP_PORT = 9333;
const APP_PORT = 5181;
const { spawn } = require("child_process");

const routes = [
  "/",
  "/sports",
  "/sports/my-sports",
  "/sports/schedule",
  "/sports/auction",
  "/sports/admin",
  "/sports/analytics",
  "/marketplace",
  "/jobs",
  "/events",
  "/admin",
  "/admin/venues",
  "/admin/roles",
  "/profile",
];

const chrome = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    `--remote-debugging-port=${CDP_PORT}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--user-data-dir=C:\\temp\\cdp-profile-scan",
  ],
  { stdio: "ignore" }
);

async function getTarget() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new`, { method: "PUT" });
  const text = await res.text();
  return JSON.parse(text);
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("open", () => resolve(ws));
    ws.addEventListener("error", reject);
  });
}

let msgId = 1;
function send(ws, method, params = {}) {
  const id = msgId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => {
    const handler = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.id === id) {
        ws.removeEventListener("message", handler);
        resolve(data.result);
      }
    };
    ws.addEventListener("message", handler);
  });
}

async function main() {
  const target = await getTarget();
  const ws = await connect(target.webSocketDebuggerUrl);

  await send(ws, "Page.enable");
  await send(ws, "Network.enable");
  await send(ws, "Runtime.enable");

  // Seed localStorage on the app's origin first
  await send(ws, "Page.navigate", { url: `http://localhost:${APP_PORT}/login` });
  await new Promise((r) => setTimeout(r, 1500));

  const user = {
    userId: "1",
    role: "SUPER_ADMIN",
    fullName: "Test Admin",
    email: "admin@test.com",
    communityId: 1,
    permissions: [],
  };

  await send(ws, "Runtime.evaluate", {
    expression: `
      localStorage.setItem("mana_token", "${"a".repeat(10)}.${Buffer.from(JSON.stringify({ role: "SUPER_ADMIN", communityId: 1 })).toString("base64")}.${"c".repeat(10)}");
      localStorage.setItem("mana_user", '${JSON.stringify(user)}');
    `,
  });

  const results = {};

  for (const route of routes) {
    const counts = {};
    const onRequest = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.method === "Network.requestWillBeSent") {
        const url = data.params.request.url;
        const m = url.match(/\/api\/[^\s?]*/);
        if (m) {
          counts[m[0]] = (counts[m[0]] || 0) + 1;
        }
      }
    };
    ws.addEventListener("message", onRequest);

    await send(ws, "Page.navigate", { url: `http://localhost:${APP_PORT}${route}` });
    await new Promise((r) => setTimeout(r, 2000));

    ws.removeEventListener("message", onRequest);
    results[route] = counts;
  }

  console.log(JSON.stringify(results, null, 2));
  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
