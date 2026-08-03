import { useState } from "react";
import {
  User, Mail, Phone, MapPin, Calendar, Clock, CheckCircle2,
  ChevronRight, ChevronLeft, Ticket, CreditCard, Smartphone,
  Banknote, QrCode, Download, Share2, Star, Users, Shield,
  ArrowRight, Sparkles,
} from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/components/ui/utils";

/* ─── Mock event data ─── */
// TODO: wire to eventService
const EVENT = {
  id: "EVT-2026-01",
  title: "Ganesh Chaturthi Grand Festival 2026",
  date: "August 22–31, 2026",
  time: "8:00 AM onwards",
  venue: "Society Ground & Community Hall, Andheri East, Mumbai",
  organizer: "NexusApp Community",
  coverGradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c4b5fd 100%)",
  description:
    "Join us for 10 days of devotion, culture, and celebration! Featuring live performances, cultural programs, food courts, competitions, and the grand visarjan procession.",
  categories: [
    {
      id: "family",
      name: "Family Pass",
      icon: Users,
      price: 500,
      badge: "Most Popular",
      badgeColor: "#10b981",
      includes: ["Entry for 2 adults + 2 children", "Welcome gift kit", "Priority seating", "Food coupon ₹200"],
      qty: 200,
      remaining: 73,
    },
    {
      id: "individual",
      name: "Individual",
      icon: User,
      price: 200,
      badge: null,
      badgeColor: "",
      includes: ["Single entry", "Programme booklet", "Food coupon ₹100"],
      qty: 500,
      remaining: 312,
    },
    {
      id: "vip",
      name: "VIP Experience",
      icon: Star,
      price: 1500,
      badge: "Premium",
      badgeColor: "#6366f1",
      includes: ["VIP lounge access", "5 seats reserved front row", "Welcome hamper", "Dinner invite", "Certificate"],
      qty: 50,
      remaining: 18,
    },
    {
      id: "volunteer",
      name: "Volunteer",
      icon: Sparkles,
      price: 0,
      badge: "Free",
      badgeColor: "#4f46e5",
      includes: ["Volunteer T-shirt", "Meals provided", "Certificate of appreciation", "Volunteer ID"],
      qty: 150,
      remaining: 42,
    },
  ],
};

/* ─── Types ─── */
interface RegForm {
  category: string;
  qty: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  tshirtSize: string;
  volunteering: string;
  paymentMethod: string;
  upiId: string;
}

const STEPS = [
  { id: 1, label: "Choose Pass" },
  { id: 2, label: "Your Details" },
  { id: 3, label: "Payment"    },
  { id: 4, label: "Confirm"   },
];

const T_SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const VOLUNTEER_ROLES = ["Food & Kitchen", "Registration", "Security", "Decoration", "Audio/Visual", "Medical Support", "Guest Management"];

/* ─── Step components ─── */
function Step1Category({ form, update }: { form: RegForm; update: (k: keyof RegForm, v: any) => void }) {
  const selected = EVENT.categories.find(c => c.id === form.category);
  const total = selected ? selected.price * form.qty : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EVENT.categories.map(cat => {
          const isSelected = form.category === cat.id;
          const soldPct = Math.round((1 - cat.remaining / cat.qty) * 100);
          return (
            <button key={cat.id}
              onClick={() => update("category", cat.id)}
              className={cn(
                "p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden hover:-translate-y-0.5 active:scale-[0.98]",
                isSelected
                  ? "border-indigo-400 bg-indigo-50 shadow-[0_4px_20px_rgba(99,102,241,0.2)]"
                  : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
              )}>

              {cat.badge && (
                <Badge className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black text-white border-none"
                  style={{ background: cat.badgeColor }}>{cat.badge}</Badge>
              )}

              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                isSelected ? "bg-indigo-500" : "bg-slate-100"
              )}>
                <cat.icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-slate-500"}`} />
              </div>

              <p className={`font-black text-lg ${isSelected ? "text-indigo-700" : "text-slate-900"}`}>{cat.name}</p>
              <p className={`text-xl font-black mt-0.5 ${isSelected ? "text-indigo-600" : "text-slate-700"}`}>
                {cat.price === 0 ? "FREE" : `₹${cat.price}`}
              </p>

              <ul className="mt-3 space-y-1">
                {cat.includes.map(inc => (
                  <li key={inc} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <CheckCircle2 className={`w-3 h-3 flex-shrink-0 mt-0.5 ${isSelected ? "text-indigo-500" : "text-slate-400"}`} />
                    {inc}
                  </li>
                ))}
              </ul>

              {/* Availability bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[9px] font-semibold text-slate-400 mb-1">
                  <span>{cat.remaining} left</span>
                  <span>{soldPct}% sold</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-400" style={{ width: `${soldPct}%` }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="animate-fade-in-up bg-white rounded-2xl p-5 border border-indigo-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-slate-700">Quantity</p>
            <div className="flex items-center gap-3">
              <button onClick={() => update("qty", Math.max(1, form.qty - 1))}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 hover:bg-indigo-100 transition-all">
                −
              </button>
              <span className="w-8 text-center font-black text-slate-900">{form.qty}</span>
              <button onClick={() => update("qty", Math.min(10, form.qty + 1))}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 hover:bg-indigo-100 transition-all">
                +
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-sm text-slate-500">Total Amount</span>
            <span className="text-xl font-black text-indigo-600">
              {total === 0 ? "FREE" : `₹${total.toLocaleString()}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Step2Details({ form, update }: { form: RegForm; update: (k: keyof RegForm, v: any) => void }) {
  const isVolunteer = form.category === "volunteer";
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
            First Name<span className="text-rose-500 ml-0.5">*</span>
          </Label>
          <Input value={form.firstName} onChange={e => update("firstName", e.target.value)} placeholder="Arjun"
            className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
        </div>
        <div>
          <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
            Last Name<span className="text-rose-500 ml-0.5">*</span>
          </Label>
          <Input value={form.lastName} onChange={e => update("lastName", e.target.value)} placeholder="Sharma"
            className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
        </div>
      </div>

      <div>
        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
          Email Address<span className="text-rose-500 ml-0.5">*</span>
        </Label>
        <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="arjun@example.com"
          className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
        <p className="text-[10px] text-slate-400 mt-1">Your e-ticket will be sent here</p>
      </div>

      <div>
        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
          Mobile Number<span className="text-rose-500 ml-0.5">*</span>
        </Label>
        <Input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+91 98765 43210"
          className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
      </div>

      <div>
        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">Address</Label>
        <Input value={form.address} onChange={e => update("address", e.target.value)} placeholder="Flat / Building / Street"
          className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
      </div>

      <div>
        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">City</Label>
        <Input value={form.city} onChange={e => update("city", e.target.value)} placeholder="Mumbai"
          className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
      </div>

      {isVolunteer && (
        <div className="animate-fade-in-up space-y-4 pt-2 border-t border-slate-100">
          <p className="text-sm font-bold text-indigo-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Volunteer Preferences
          </p>
          <div>
            <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">Preferred Role</Label>
            <Select value={form.volunteering} onValueChange={v => update("volunteering", v)}>
              <SelectTrigger className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800">
                <SelectValue placeholder="Select your preferred role" />
              </SelectTrigger>
              <SelectContent>
                {VOLUNTEER_ROLES.map(o => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">T-Shirt Size</Label>
            <div className="flex gap-2 flex-wrap">
              {T_SHIRT_SIZES.map(sz => (
                <button key={sz} onClick={() => update("tshirtSize", sz)}
                  className={cn(
                    "w-12 h-10 rounded-xl border-2 text-sm font-bold transition-all",
                    form.tshirtSize === sz
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                  )}>
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Step3Payment({ form, update }: { form: RegForm; update: (k: keyof RegForm, v: any) => void }) {
  const selected = EVENT.categories.find(c => c.id === form.category);
  const total = selected ? selected.price * form.qty : 0;

  if (total === 0) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
          <Sparkles className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="font-black text-slate-900 text-xl">No Payment Required!</h3>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          Your registration is free. Review your details and confirm to get your pass.
        </p>
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 max-w-xs mx-auto">
          <p className="text-emerald-800 font-bold text-sm">Registration Type: {selected?.name}</p>
          <p className="text-emerald-600 text-xs mt-1">Amount: FREE</p>
        </div>
      </div>
    );
  }

  const methods = [
    { id: "upi",  label: "UPI / QR Code", icon: Smartphone, desc: "Pay via any UPI app" },
    { id: "card", label: "Card / Net Banking", icon: CreditCard, desc: "Visa, Mastercard, etc." },
    { id: "cash", label: "Cash at Venue", icon: Banknote, desc: "Pay on the day of event" },
  ];

  return (
    <div className="space-y-5">
      {/* Amount summary */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-slate-600">{selected?.name} × {form.qty}</p>
            <p className="text-xs text-slate-400">₹{selected?.price} per pass</p>
          </div>
          <p className="text-2xl font-black text-indigo-600">₹{total.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment methods */}
      <div>
        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
          Payment Method<span className="text-rose-500 ml-0.5">*</span>
        </Label>
        <div className="space-y-2.5">
          {methods.map(m => (
            <button key={m.id} onClick={() => update("paymentMethod", m.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                form.paymentMethod === m.id
                  ? "border-indigo-400 bg-indigo-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-indigo-200"
              )}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                form.paymentMethod === m.id ? "bg-indigo-500" : "bg-slate-100"
              )}>
                <m.icon className={`w-5 h-5 ${form.paymentMethod === m.id ? "text-white" : "text-slate-500"}`} />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm ${form.paymentMethod === m.id ? "text-indigo-700" : "text-slate-800"}`}>
                  {m.label}
                </p>
                <p className="text-xs text-slate-400">{m.desc}</p>
              </div>
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex-shrink-0",
                form.paymentMethod === m.id ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
              )}>
                {form.paymentMethod === m.id && (
                  <div className="w-full h-full rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {form.paymentMethod === "upi" && (
        <div className="animate-fade-in-up p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-24 h-24 bg-slate-100 rounded-xl mx-auto flex items-center justify-center">
            <QrCode className="w-12 h-12 text-slate-500" />
          </div>
          <p className="text-xs text-slate-500">Scan with any UPI app or enter UPI ID</p>
          <Input value={form.upiId} onChange={e => update("upiId", e.target.value)} placeholder="yourname@upi"
            className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
          <p className="text-[10px] text-slate-400">UPI ID: nexusapp@icici</p>
        </div>
      )}

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-xs text-slate-500">
        <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        Your payment is secure and encrypted. No card data is stored.
      </div>
    </div>
  );
}

function Step4Confirm({ form }: { form: RegForm }) {
  const selected = EVENT.categories.find(c => c.id === form.category);
  const total = selected ? selected.price * form.qty : 0;
  const regId = `REG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const name = `${form.firstName} ${form.lastName}`.trim() || "Attendee";

  return (
    <div className="space-y-5">
      {/* Digital Pass */}
      <div className="rounded-2xl overflow-hidden border border-indigo-200 shadow-[0_4px_24px_rgba(99,102,241,0.15)]">
        {/* Pass header */}
        <div className="px-6 py-5 text-white relative overflow-hidden"
          style={{ background: EVENT.coverGradient }}>
          <div className="absolute inset-0 opacity-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute rounded-full bg-white/30"
                style={{ width: 80 + i * 20, height: 80 + i * 20, top: `${i * 15 - 20}%`, right: `${i * 8 - 15}%` }} />
            ))}
          </div>
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/70 mb-1">Digital Event Pass</p>
            <h3 className="font-black text-lg leading-tight">{EVENT.title}</h3>
            <div className="flex items-center gap-3 mt-3 text-xs text-white/80">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{EVENT.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{EVENT.time}</span>
            </div>
          </div>
        </div>

        {/* Pass body */}
        <div className="bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Holder</p>
                <p className="font-black text-slate-900 text-lg">{name}</p>
                <p className="text-xs text-slate-500">{form.email || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                  <p className="font-bold text-slate-700 text-sm">{selected?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty</p>
                  <p className="font-bold text-slate-700 text-sm">{form.qty}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                  <p className="font-bold text-indigo-600 text-sm">{total === 0 ? "FREE" : `₹${total.toLocaleString()}`}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment</p>
                  <p className="font-bold text-slate-700 text-sm capitalize">{total === 0 ? "N/A" : form.paymentMethod || "—"}</p>
                </div>
              </div>
            </div>

            {/* QR code area */}
            <div className="flex-shrink-0 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                <QrCode className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-[9px] font-bold text-slate-400 mt-1.5 font-mono">{regId}</p>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 border-t border-dashed border-slate-200" />
            <Ticket className="w-4 h-4 text-slate-300 rotate-90" />
            <div className="flex-1 border-t border-dashed border-slate-200" />
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-500">{EVENT.venue}</p>
          </div>
        </div>

        {/* Action strip */}
        <div className="flex divide-x divide-slate-100 border-t border-slate-100">
          {[
            { icon: Download, label: "Download" },
            { icon: Share2, label: "Share"    },
          ].map(a => (
            <button key={a.label}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              <a.icon className="w-4 h-4" /> {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-emerald-800">Registration Complete!</p>
          <p className="text-xs text-emerald-700 mt-0.5">A copy of your pass will be emailed to {form.email || "your email address"}.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export function EventsUserRegistration() {
  const [step, setStep] = useState(1);
  const [isRegistered, setIsRegistered] = useState(false);

  const [form, setForm] = useState<RegForm>({
    category: "", qty: 1,
    firstName: "", lastName: "", email: "", phone: "", address: "", city: "",
    tshirtSize: "", volunteering: "",
    paymentMethod: "", upiId: "",
  });

  const update = (key: keyof RegForm, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const selected = EVENT.categories.find(c => c.id === form.category);

  const canNext = (): boolean => {
    if (step === 1) return !!form.category;
    if (step === 2) return !!(form.firstName && form.email && form.phone);
    if (step === 3) return selected?.price === 0 || !!form.paymentMethod;
    return true;
  };

  const handleConfirm = () => setIsRegistered(true);

  const stepContent = {
    1: <Step1Category form={form} update={update} />,
    2: <Step2Details form={form} update={update} />,
    3: <Step3Payment form={form} update={update} />,
    4: <Step4Confirm form={form} />,
  };

  return (
    <div className="max-w-2xl mx-auto">

      {/* Event hero */}
      <div className="rounded-2xl overflow-hidden mb-7 shadow-[0_4px_20px_rgba(99,102,241,0.2)]">
        <div className="px-8 py-8 text-white relative overflow-hidden"
          style={{ background: EVENT.coverGradient }}>
          <div className="absolute inset-0">
            {[...Array(5)].map((_, i) => (
              <div key={i}
                className="absolute rounded-full bg-white/10 animate-pulse"
                style={{ width: 60 + i * 40, height: 60 + i * 40, top: `${i * 20}%`, right: `${i * 10}%` }} />
            ))}
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider text-white/90">
                Open Registration
              </span>
            </div>
            <h1 className="text-xl font-black leading-tight mb-3">{EVENT.title}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/80">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{EVENT.date}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{EVENT.time}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{EVENT.venue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-6 px-1">
        {STEPS.map((s, i) => {
          const done = step > s.id || isRegistered;
          const active = step === s.id && !isRegistered;
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all",
                  done ? "bg-emerald-500 border-emerald-500 text-white"
                  : active ? "bg-indigo-500 border-indigo-500 text-white"
                  : "bg-white border-slate-200 text-slate-400"
                )}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                <span className={cn(
                  "text-[9px] font-bold whitespace-nowrap",
                  active ? "text-indigo-600" : done ? "text-emerald-600" : "text-slate-400"
                )}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mb-4 mx-1 rounded-full transition-all",
                  done ? "bg-emerald-400" : "bg-slate-200"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-7 py-6 border-b border-slate-50">
          <h2 className="font-black text-slate-900">
            {isRegistered ? "Your Registration Pass" : STEPS[step - 1].label}
          </h2>
          {!isRegistered && (
            <p className="text-xs text-slate-400 mt-0.5">Step {step} of {STEPS.length}</p>
          )}
        </div>

        <div className="px-7 py-6">
          <div key={isRegistered ? "done" : step} className="animate-fade-in-up">
            {isRegistered
              ? <Step4Confirm form={form} />
              : (stepContent as any)[step]}
          </div>
        </div>

        {!isRegistered && (
          <div className="px-7 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <Button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
              variant="outline"
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 h-auto rounded-xl text-sm font-semibold transition-all",
                step === 1 ? "text-slate-300 cursor-not-allowed" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}>
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>

            {step < STEPS.length ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 h-auto rounded-xl text-sm font-bold transition-all",
                  canNext()
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm hover:from-indigo-600 hover:to-violet-600"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-2.5 h-auto rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm hover:from-emerald-600 hover:to-teal-600 transition-all">
                Confirm Registration <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
