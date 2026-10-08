import React, { useState } from "react";
import { SEED_DOCTORS, SEED_LAB_PACKAGES, SEED_EMERGENCY_CONTACTS } from "../../services/healthService";
import type { DoctorDto, LabPackageDto } from "../../types/health";

export const HealthPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"doctors" | "appointments" | "family" | "records" | "labs" | "homecare" | "emergency" | "ai">("doctors");
  const [searchSpecialty, setSearchSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDto | null>(null);

  const filteredDoctors = SEED_DOCTORS.filter(d =>
    d.name.toLowerCase().includes(searchSpecialty.toLowerCase()) ||
    d.specialty.toLowerCase().includes(searchSpecialty.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-teal-600 to-emerald-700 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h1 className="text-3xl font-bold">🩺 Mana Health</h1>
          <p className="text-teal-100 mt-1">Trusted healthcare network for your community — discover, consult, book & manage for your family.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("emergency")}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl shadow transition animate-pulse flex items-center gap-2"
          >
            🚨 Medical SOS
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className="bg-white text-teal-800 font-semibold py-2 px-4 rounded-xl shadow hover:bg-teal-50 transition"
          >
            🤖 AI Symptom Guide
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-2">
        {[
          { id: "doctors", label: "👨‍⚕️ Find Doctors" },
          { id: "appointments", label: "📅 Appointments" },
          { id: "family", label: "👨‍👩‍👧 Family Health" },
          { id: "records", label: "🔒 Health Vault" },
          { id: "labs", label: "🧪 Lab Tests" },
          { id: "homecare", label: "🏡 Home Care" },
          { id: "emergency", label: "🚨 Community Emergency" },
          { id: "ai", label: "💡 AI Assistant" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Doctors */}
      {activeTab === "doctors" && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by specialty, doctor name, or condition (e.g. Cardiologist, Fever)..."
              value={searchSpecialty}
              onChange={e => setSearchSpecialty(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map(doc => (
              <div key={doc.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-gray-900">{doc.name}</h3>
                      {doc.verifiedBadge && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">✓ Verified</span>
                      )}
                    </div>
                    <p className="text-sm text-teal-700 font-medium">{doc.specialty}</p>
                    <p className="text-xs text-gray-500">{doc.qualifications.join(", ")} • {doc.experienceYears} yrs exp</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-lg font-bold">⭐ {doc.rating}</span>
                    <p className="text-xs text-gray-500 mt-1">₹{doc.consultationFee}</p>
                  </div>
                </div>
                <div className="bg-teal-50 p-2.5 rounded-xl text-xs text-teal-900 font-medium">
                  🛡️ <strong>{doc.verifiedCommunityConsultations} verified community members</strong> consulted this doctor.
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Next: <strong className="text-emerald-700">{doc.nextAvailableSlot}</strong></span>
                  <span>Modes: {doc.consultationModes.join(", ")}</span>
                </div>
                <button
                  onClick={() => setSelectedDoctor(doc)}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-xl transition"
                >
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Emergency */}
      {activeTab === "emergency" && (
        <div className="space-y-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
            <h3 className="text-red-900 font-bold text-lg">24x7 Verified Community Emergency Health Network</h3>
            <p className="text-red-700 text-sm mt-1">Directly integrated with Mana Emergency & Security Room. Medical alerts notify primary response teams instantaneously.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SEED_EMERGENCY_CONTACTS.map(em => (
              <div key={em.id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-xs bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">{em.type}</span>
                  <h4 className="font-bold text-gray-900 mt-1">{em.name}</h4>
                  <p className="text-xs text-gray-500">{em.address} • {em.distanceKm} km away</p>
                </div>
                <a
                  href={`tel:${em.phone}`}
                  className="bg-red-600 text-white font-bold py-2 px-4 rounded-xl text-sm hover:bg-red-700 transition"
                >
                  📞 {em.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Labs */}
      {activeTab === "labs" && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-900">Preventive Health Packages & Home Sample Collection</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SEED_LAB_PACKAGES.map(pkg => (
              <div key={pkg.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{pkg.name}</h4>
                    <p className="text-xs text-gray-500">{pkg.testCount} Parameters Included • Reports in {pkg.reportTurnaroundHours}h</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-teal-700">₹{pkg.price}</span>
                    <span className="text-xs text-gray-400 line-through block">₹{pkg.originalPrice}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pkg.testsIncluded.map((t, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md font-medium">{t}</span>
                  ))}
                </div>
                <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-xl transition">
                  Book Home Collection Slot
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthPortal;