import { useState } from "react";
import { QrCode, Link2, Wifi, IndianRupee, FileText, Download, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "react-toastify";

type QrType = "url" | "upi" | "wifi" | "text";

export function QrCodeStudioView() {
  const [type, setType] = useState<QrType>("upi");

  // Form states
  const [url, setUrl] = useState<string>("https://manacommunity.com");
  const [upiVpa, setUpiVpa] = useState<string>("sandeep@upi");
  const [upiName, setUpiName] = useState<string>("Sandeep");
  const [upiAmount, setUpiAmount] = useState<string>("500");
  const [wifiSsid, setWifiSsid] = useState<string>("Home_WiFi");
  const [wifiPassword, setWifiPassword] = useState<string>("password123");
  const [plainText, setPlainText] = useState<string>("Welcome to Mana Community!");

  const [copied, setCopied] = useState<boolean>(false);

  // Compute payload
  const getPayload = (): string => {
    switch (type) {
      case "url":
        return url.startsWith("http") ? url : `https://${url}`;
      case "upi": {
        const amParam = upiAmount ? `&am=${encodeURIComponent(upiAmount)}` : "";
        return `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(upiName || "Payee")}${amParam}&cu=INR`;
      }
      case "wifi":
        return `WIFI:S:${wifiSsid};T:WPA;P:${wifiPassword};;`;
      case "text":
        return plainText;
    }
  };

  const payload = getPayload();
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    payload || "mana"
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success("QR Content / Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `mkit-qrcode-${type}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR Code downloaded as PNG!");
    } catch {
      window.open(qrImageUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex bg-slate-100 p-1.5 rounded-xl">
            {[
              { id: "upi", label: "UPI Pay", icon: IndianRupee },
              { id: "url", label: "URL Link", icon: Link2 },
              { id: "wifi", label: "WiFi Auto", icon: Wifi },
              { id: "text", label: "Plain Text", icon: FileText },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setType(t.id as any)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    type === t.id
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Form Fields by Type */}
          {type === "upi" && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                UPI Payment QR Code
              </h3>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 block mb-1">
                  UPI VPA / ID (e.g. mobile@upi)
                </label>
                <input
                  type="text"
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  placeholder="name@okhdfcbank"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 block mb-1">
                    Payee Name
                  </label>
                  <input
                    type="text"
                    value={upiName}
                    onChange={(e) => setUpiName(e.target.value)}
                    placeholder="Sandeep"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 block mb-1">
                    Amount in ₹ (Optional)
                  </label>
                  <input
                    type="number"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(e.target.value)}
                    placeholder="500"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {type === "url" && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Link2 className="w-4 h-4 text-indigo-600" />
                Website URL Link
              </h3>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 block mb-1">
                  Target Web URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {type === "wifi" && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Wifi className="w-4 h-4 text-blue-600" />
                WiFi Auto-Connect QR Code
              </h3>
              <p className="text-xs text-slate-500">
                Guests can simply point their smartphone camera at the QR code to connect automatically without typing passwords!
              </p>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 block mb-1">
                  WiFi Network Name (SSID)
                </label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="MyHome_5G"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 block mb-1">
                  WiFi Password
                </label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="WPA2 Password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {type === "text" && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Plain Text / Message
              </h3>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 block mb-1">
                  Message Content
                </label>
                <textarea
                  rows={4}
                  value={plainText}
                  onChange={(e) => setPlainText(e.target.value)}
                  placeholder="Enter text to encode..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Raw String preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Encoded String</span>
            <p className="text-xs font-mono text-slate-600 break-all select-all">{payload}</p>
          </div>
        </div>

        {/* Right QR Preview & Download Column */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-xl flex flex-col items-center justify-between">
          <div className="text-center w-full">
            <p className="text-xs uppercase tracking-wider text-indigo-300 font-semibold mb-3">
              Live Scannable QR Code
            </p>

            {/* White QR Canvas Frame */}
            <div className="bg-white p-4 rounded-2xl shadow-md inline-block">
              <img
                src={qrImageUrl}
                alt="Generated QR"
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>
            <p className="text-xs text-indigo-300 mt-3">Scan with Google Lens, Phone Camera, or UPI app</p>
          </div>

          <div className="w-full space-y-2.5 mt-6 pt-4 border-t border-white/10">
            <button
              onClick={handleDownload}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
            >
              <Download className="w-4 h-4" />
              Download High-Res PNG
            </button>
            <button
              onClick={handleCopy}
              className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Payload String"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
