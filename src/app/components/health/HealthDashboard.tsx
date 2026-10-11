import { useState } from 'react';
import {
  HeartPulse, Stethoscope, CalendarPlus, Users, Lock, TestTube2, Phone,
  Brain, FileText, Upload, Shield, Clock, Video, MapPin, AlertCircle,
  ChevronRight, Plus, Activity,
} from 'lucide-react';

const quickActions = [
  { icon: Stethoscope, label: 'Find Doctors', desc: 'Search nearby specialists', color: '#3b82f6' },
  { icon: CalendarPlus, label: 'Book Appointment', desc: 'Schedule a visit or teleconsult', color: '#8b5cf6' },
  { icon: Users, label: 'Family Health', desc: 'Manage family profiles', color: '#10b981' },
  { icon: Lock, label: 'Health Vault', desc: 'Store medical records securely', color: '#f59e0b' },
  { icon: TestTube2, label: 'Lab Packages', desc: 'Preventive health checkups', color: '#ef4444' },
  { icon: Phone, label: 'Emergency', desc: 'Quick access to helplines', color: '#dc2626' },
];

const appointments = [
  { doctor: 'Dr. Priya Sharma', specialty: 'General Physician', date: 'Mon, 14 Oct 2026', time: '10:30 AM', mode: 'Video', status: 'Confirmed' },
  { doctor: 'Dr. Rajesh Kulkarni', specialty: 'Dermatologist', date: 'Wed, 16 Oct 2026', time: '3:00 PM', mode: 'In-Person', status: 'Pending' },
  { doctor: 'Dr. Ananya Desai', specialty: 'Pediatrician', date: 'Fri, 18 Oct 2026', time: '11:00 AM', mode: 'Video', status: 'Confirmed' },
];

const familyMembers = [
  { initials: 'AS', name: 'Amit Sharma', relation: 'Self', lastCheckup: '12 Sep 2026', color: '#3b82f6' },
  { initials: 'PS', name: 'Priya Sharma', relation: 'Spouse', lastCheckup: '08 Aug 2026', color: '#ec4899' },
  { initials: 'RS', name: 'Rohan Sharma', relation: 'Son', lastCheckup: '20 Jul 2026', color: '#10b981' },
  { initials: 'MS', name: 'Meera Sharma', relation: 'Mother', lastCheckup: '05 Jun 2026', color: '#f59e0b' },
];

const recentUploads = [
  { name: 'Blood Report - Sep 2026.pdf', date: '12 Sep 2026', type: 'Lab Report' },
  { name: 'Prescription - Dr. Sharma.pdf', date: '10 Sep 2026', type: 'Prescription' },
  { name: 'X-Ray - Left Knee.jpg', date: '28 Aug 2026', type: 'Imaging' },
];

const labPackages = [
  { name: 'Full Body Checkup', tests: 78, price: 1499, originalPrice: 3200 },
  { name: 'Diabetes Screening', tests: 22, price: 699, originalPrice: 1500 },
  { name: 'Thyroid Profile', tests: 5, price: 449, originalPrice: 900 },
];

const symptomChips = ['Headache', 'Fever', 'Back Pain', 'Cough'];

const card: React.CSSProperties = {
  background: 'var(--card)',
  borderRadius: 14,
  border: '1px solid color-mix(in srgb, var(--text) 10%, transparent)',
  padding: 20,
};

export function HealthDashboard() {
  const [symptomText, setSymptomText] = useState('');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', color: 'var(--text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <HeartPulse size={30} color="var(--gold)" />
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Health Hub</h1>
      </div>
      <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: 28, fontSize: 14 }}>
        Your family's health, simplified
      </p>

      {/* Quick Actions Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: 14,
        marginBottom: 32,
      }}>
        {quickActions.map((a) => (
          <div key={a.label} style={{
            ...card,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            borderLeft: `4px solid ${a.color}`,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <a.icon size={20} color={a.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{a.desc}</div>
            </div>
            <ChevronRight size={16} color="var(--muted)" />
          </div>
        ))}
      </div>

      {/* Upcoming Appointments */}
      <SectionTitle icon={Clock} title="Upcoming Appointments" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {appointments.map((apt) => (
          <div key={apt.doctor + apt.date} style={{ ...card, padding: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--gold)', color: '#fff', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0,
            }}>
              {apt.doctor.split(' ').slice(1).map(w => w[0]).join('')}
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{apt.doctor}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{apt.specialty}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
              <Clock size={13} /> {apt.date} &middot; {apt.time}
            </div>
            <Badge
              label={apt.mode}
              icon={apt.mode === 'Video' ? Video : MapPin}
              bg={apt.mode === 'Video' ? '#3b82f620' : '#10b98120'}
              color={apt.mode === 'Video' ? '#3b82f6' : '#10b981'}
            />
            <Badge
              label={apt.status}
              bg={apt.status === 'Confirmed' ? '#10b98120' : '#f59e0b20'}
              color={apt.status === 'Confirmed' ? '#10b981' : '#f59e0b'}
            />
          </div>
        ))}
      </div>

      {/* AI Symptom Navigator */}
      <SectionTitle icon={Brain} title="AI Symptom Navigator" />
      <div style={{ ...card, marginBottom: 32 }}>
        <p style={{ margin: '0 0 12px', fontSize: 14 }}>Describe your symptoms to get guidance on possible conditions and next steps.</p>
        <textarea
          value={symptomText}
          onChange={(e) => setSymptomText(e.target.value)}
          placeholder="E.g. I have a mild headache and slight fever since yesterday..."
          style={{
            width: '100%', minHeight: 80, borderRadius: 10, border: '1px solid color-mix(in srgb, var(--text) 15%, transparent)',
            background: 'var(--background)', color: 'var(--text)', padding: 12, fontSize: 14,
            resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {symptomChips.map((s) => (
            <button key={s} onClick={() => setSymptomText(s)} style={{
              background: 'var(--background)', border: '1px solid color-mix(in srgb, var(--text) 15%, transparent)',
              borderRadius: 20, padding: '6px 14px', fontSize: 12, color: 'var(--text)', cursor: 'pointer',
            }}>
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
          <AlertCircle size={13} />
          For guidance only — consult a doctor for medical advice
        </div>
      </div>

      {/* Family Health Profiles */}
      <SectionTitle icon={Users} title="Family Health Profiles" />
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, marginBottom: 32 }}>
        {familyMembers.map((m) => (
          <div key={m.name} style={{ ...card, minWidth: 180, flexShrink: 0, textAlign: 'center', padding: 18 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', margin: '0 auto 10px',
              background: `${m.color}20`, color: m.color, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16,
            }}>
              {m.initials}
            </div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{m.relation}</div>
            <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 8 }}>
              <Clock size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
              Last checkup: {m.lastCheckup}
            </div>
            <div style={{
              marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 4,
              background: '#10b98115', color: '#10b981', borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 600,
            }}>
              <Shield size={11} /> Consent: Active
            </div>
          </div>
        ))}
      </div>

      {/* Health Vault */}
      <SectionTitle icon={Lock} title="Health Vault" />
      <div style={{ ...card, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color="var(--gold)" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{recentUploads.length} Documents</span>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold)', color: '#fff',
            border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <Upload size={14} /> Upload Record
          </button>
        </div>
        {recentUploads.map((f, i) => (
          <div key={f.name} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
            borderTop: i === 0 ? 'none' : '1px solid color-mix(in srgb, var(--text) 8%, transparent)',
          }}>
            <FileText size={18} color="var(--muted)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{f.type} &middot; {f.date}</div>
            </div>
            <ChevronRight size={15} color="var(--muted)" />
          </div>
        ))}
      </div>

      {/* Preventive Health / Lab Packages */}
      <SectionTitle icon={TestTube2} title="Preventive Health" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 32 }}>
        {labPackages.map((pkg) => (
          <div key={pkg.name} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{pkg.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{pkg.tests} tests included</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>₹{pkg.price}</span>
              <span style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'line-through' }}>₹{pkg.originalPrice}</span>
            </div>
            <button style={{
              marginTop: 'auto', background: 'var(--background)', border: '1px solid var(--gold)',
              borderRadius: 10, padding: '8px 0', fontSize: 13, fontWeight: 600, color: 'var(--gold)', cursor: 'pointer',
            }}>
              Book Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <Icon size={18} color="var(--gold)" />
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h2>
    </div>
  );
}

function Badge({ label, icon: Icon, bg, color: c }: { label: string; icon?: React.ElementType; bg: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: bg, color: c, borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600,
    }}>
      {Icon && <Icon size={12} />}
      {label}
    </span>
  );
}
