import { useState } from "react";
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Copy,
  Type, AlignLeft, Hash, Mail, Phone, Calendar, List,
  CircleDot, CheckSquare, Upload, SeparatorHorizontal,
  Users, Eye, EyeOff, Settings2, Sparkles, FileText,
  Shield, Stethoscope, Accessibility, Megaphone, Shirt,
  Heart, ArrowUp, ArrowDown, Pencil, X, Check,
  ToggleLeft, HelpCircle, ChevronRight,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";

/* ─── Types ─── */
export type FieldType =
  | "text" | "textarea" | "number" | "email" | "phone" | "date"
  | "select" | "multiselect" | "radio" | "checkbox"
  | "file" | "section" | "family_repeater";

export interface ConditionalRule {
  fieldId: string;
  operator: "equals" | "not_equals" | "contains" | "is_empty" | "is_not_empty";
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string;
  description: string;
  required: boolean;
  options: string[];
  width: "full" | "half";
  validation: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditional: ConditionalRule | null;
  familyFields?: FormField[];
}

export interface RegistrationFormConfig {
  fields: FormField[];
  allowFamilyRegistration: boolean;
  maxFamilyMembers: number;
  confirmationMessage: string;
  collectPayment: boolean;
}

/* ─── Constants ─── */
const FIELD_TYPE_META: Record<FieldType, { label: string; icon: any; color: string; bg: string }> = {
  text:             { label: "Short Text",      icon: Type,               color: "#4f46e5", bg: "#eef2ff" },
  textarea:         { label: "Long Text",       icon: AlignLeft,          color: "#7c3aed", bg: "#f5f3ff" },
  number:           { label: "Number",          icon: Hash,               color: "#0891b2", bg: "#ecfeff" },
  email:            { label: "Email",           icon: Mail,               color: "#059669", bg: "#ecfdf5" },
  phone:            { label: "Phone",           icon: Phone,              color: "#d97706", bg: "#fffbeb" },
  date:             { label: "Date",            icon: Calendar,           color: "#be185d", bg: "#fdf2f8" },
  select:           { label: "Dropdown",        icon: List,        color: "#4f46e5", bg: "#eef2ff" },
  multiselect:      { label: "Multi Select",    icon: CheckSquare,        color: "#7c3aed", bg: "#f5f3ff" },
  radio:            { label: "Radio Buttons",   icon: CircleDot,          color: "#059669", bg: "#ecfdf5" },
  checkbox:         { label: "Checkbox",        icon: CheckSquare,        color: "#d97706", bg: "#fffbeb" },
  file:             { label: "File Upload",     icon: Upload,             color: "#374151", bg: "#f9fafb" },
  section:          { label: "Section Header",  icon: SeparatorHorizontal, color: "#64748b", bg: "#f8fafc" },
  family_repeater:  { label: "Family Members",  icon: Users,              color: "#be185d", bg: "#fdf2f8" },
};

interface FieldTemplate {
  id: string;
  label: string;
  icon: any;
  description: string;
  fields: Omit<FormField, "id">[];
}

const FIELD_TEMPLATES: FieldTemplate[] = [
  {
    id: "personal",
    label: "Personal Info",
    icon: FileText,
    description: "Name, Age, Gender",
    fields: [
      { type: "section", label: "Personal Information", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
      { type: "text", label: "First Name", placeholder: "Enter first name", description: "", required: true, options: [], width: "half", validation: {}, conditional: null },
      { type: "text", label: "Last Name", placeholder: "Enter last name", description: "", required: true, options: [], width: "half", validation: {}, conditional: null },
      { type: "number", label: "Age", placeholder: "e.g. 32", description: "", required: true, options: [], width: "half", validation: { min: 0, max: 120 }, conditional: null },
      { type: "select", label: "Gender", placeholder: "Select gender", description: "", required: true, options: ["Male", "Female", "Other", "Prefer not to say"], width: "half", validation: {}, conditional: null },
    ],
  },
  {
    id: "contact",
    label: "Contact Details",
    icon: Phone,
    description: "Email, Phone, Address",
    fields: [
      { type: "section", label: "Contact Details", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
      { type: "email", label: "Email Address", placeholder: "your@email.com", description: "Confirmation will be sent here", required: true, options: [], width: "full", validation: {}, conditional: null },
      { type: "phone", label: "Mobile Number", placeholder: "+91 98765 43210", description: "", required: true, options: [], width: "full", validation: {}, conditional: null },
      { type: "text", label: "Address", placeholder: "Flat / Building / Street", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
      { type: "text", label: "City", placeholder: "City", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
      { type: "text", label: "Pincode", placeholder: "400069", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
    ],
  },
  {
    id: "emergency",
    label: "Emergency Contact",
    icon: Shield,
    description: "Contact name & phone",
    fields: [
      { type: "section", label: "Emergency Contact", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
      { type: "text", label: "Emergency Contact Name", placeholder: "Contact person name", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
      { type: "phone", label: "Emergency Contact Phone", placeholder: "+91 98765 43210", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
    ],
  },
  {
    id: "medical",
    label: "Medical & Dietary",
    icon: Stethoscope,
    description: "Dietary, allergies, conditions",
    fields: [
      { type: "section", label: "Dietary & Medical Information", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
      { type: "select", label: "Dietary Preference", placeholder: "Select preference", description: "", required: false, options: ["Vegetarian", "Non-Vegetarian", "Vegan", "Jain", "Eggetarian", "No Preference"], width: "half", validation: {}, conditional: null },
      { type: "text", label: "Allergies", placeholder: "e.g. nuts, dairy, gluten", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
      { type: "textarea", label: "Medical Conditions", placeholder: "Any medical conditions we should be aware of", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
    ],
  },
  {
    id: "id_proof",
    label: "ID Verification",
    icon: Shield,
    description: "ID type & number",
    fields: [
      { type: "section", label: "ID Verification", placeholder: "", description: "Required for entry verification", required: false, options: [], width: "full", validation: {}, conditional: null },
      { type: "select", label: "ID Proof Type", placeholder: "Select ID type", description: "", required: false, options: ["Aadhaar Card", "PAN Card", "Passport", "Driving License", "Voter ID"], width: "half", validation: {}, conditional: null },
      { type: "text", label: "ID Number", placeholder: "Enter ID number", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
    ],
  },
  {
    id: "accessibility",
    label: "Accessibility",
    icon: Accessibility,
    description: "Special needs & requirements",
    fields: [
      { type: "textarea", label: "Special Needs / Accessibility", placeholder: "e.g. wheelchair access, hearing assistance", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
    ],
  },
  {
    id: "apparel",
    label: "T-Shirt / Merch",
    icon: Shirt,
    description: "T-shirt size selection",
    fields: [
      { type: "select", label: "T-Shirt Size", placeholder: "Select size", description: "", required: false, options: ["XS", "S", "M", "L", "XL", "XXL"], width: "half", validation: {}, conditional: null },
    ],
  },
  {
    id: "referral",
    label: "How did you hear?",
    icon: Megaphone,
    description: "Marketing attribution",
    fields: [
      { type: "radio", label: "How did you hear about this event?", placeholder: "", description: "", required: false, options: ["WhatsApp / Social Media", "Community Notice Board", "Friend / Family", "Email / Newsletter", "Society App", "Poster / Banner", "Other"], width: "full", validation: {}, conditional: null },
    ],
  },
  {
    id: "family",
    label: "Family Members",
    icon: Users,
    description: "Allow adding family members",
    fields: [
      {
        type: "family_repeater", label: "Family Members", placeholder: "", description: "Add family member details",
        required: false, options: [], width: "full", validation: {}, conditional: null,
        familyFields: [
          { id: "fm_name", type: "text", label: "Full Name", placeholder: "Full name", description: "", required: true, options: [], width: "half", validation: {}, conditional: null },
          { id: "fm_age", type: "number", label: "Age", placeholder: "Age", description: "", required: true, options: [], width: "half", validation: { min: 0, max: 120 }, conditional: null },
          { id: "fm_gender", type: "select", label: "Gender", placeholder: "Select gender", description: "", required: true, options: ["Male", "Female", "Other"], width: "half", validation: {}, conditional: null },
          { id: "fm_rel", type: "select", label: "Relationship", placeholder: "Select", description: "", required: true, options: ["Spouse", "Child", "Parent", "Sibling", "Other"], width: "half", validation: {}, conditional: null },
        ],
      },
    ],
  },
  {
    id: "consent",
    label: "Consent & Terms",
    icon: CheckSquare,
    description: "Terms acceptance, photography",
    fields: [
      { type: "checkbox", label: "I agree to the Terms & Conditions and Privacy Policy", placeholder: "", description: "", required: true, options: [], width: "full", validation: {}, conditional: null },
      { type: "checkbox", label: "I consent to being photographed/recorded during the event", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
    ],
  },
  {
    id: "ganesh_festival",
    label: "Ganesh Festival Pack",
    icon: Sparkles,
    description: "Puja Aarti slot, Prasadam pass, Cultural & Volunteer",
    fields: [
      { type: "section", label: "Ganesh Festival Specifics", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
      { type: "select", label: "Preferred Aarti Slot", placeholder: "Select slot", description: "", required: true, options: ["Morning Inaugural Aarti (08:00 AM)", "Afternoon Mahapooja (12:30 PM)", "Evening Grand Aarti (07:00 PM)", "Late Night Bhajan Aarti (09:30 PM)"], width: "half", validation: {}, conditional: null },
      { type: "select", label: "Mahaprasadam Meal Pass Count", placeholder: "Select meal count", description: "", required: true, options: ["1 Pass (Self)", "2 Passes", "3 Passes", "4 Passes", "5 Passes", "6+ Family Passes"], width: "half", validation: {}, conditional: null },
      { type: "select", label: "Cultural Activity Participation", placeholder: "Select activity", description: "", required: false, options: ["None / Audience Only", "Classical Dance", "Devotional Bhajan", "Kids Drawing Contest", "Rangoli Contest", "Dhol Tasha Troupe"], width: "half", validation: {}, conditional: null },
      { type: "radio", label: "Volunteer Team", placeholder: "", description: "", required: false, options: ["Prasadam Distribution", "Pandal Decoration", "Crowd & Gate Control", "Visarjan Procession", "Medical Desk", "Not Volunteering"], width: "half", validation: {}, conditional: null },
    ],
  },
];

const INPUT_CLS = "w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50";
const LABEL_CLS = "block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5";

function generateId() {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/* ─── Field Editor Modal ─── */
function FieldEditor({
  field,
  allFields,
  onSave,
  onCancel,
}: {
  field: FormField;
  allFields: FormField[];
  onSave: (f: FormField) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<FormField>({ ...field, options: [...field.options] });
  const [optionInput, setOptionInput] = useState("");
  const meta = FIELD_TYPE_META[draft.type] || FIELD_TYPE_META.text || { label: draft.type || "Text", icon: Type, bg: "#f1f5f9", color: "#64748b" };
  const hasOptions = ["select", "multiselect", "radio"].includes(draft.type);
  const otherFields = allFields.filter(f => f.id !== field.id && f.type !== "section" && f.type !== "family_repeater");

  const addOption = () => {
    const o = optionInput.trim();
    if (o && !draft.options.includes(o)) {
      setDraft(prev => ({ ...prev, options: [...prev.options, o] }));
      setOptionInput("");
    }
  };

  const removeOption = (idx: number) => {
    setDraft(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: meta.bg }}>
              <meta.icon className="w-4 h-4" style={{ color: meta.color }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Configure Field</h3>
              <p className="text-[10px] text-slate-400">{meta.label}</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Field Type */}
          <div>
            <Label className={LABEL_CLS}>Field Type</Label>
            <Select value={draft.type} onValueChange={v => setDraft(prev => ({ ...prev, type: v as FieldType }))}>
              <SelectTrigger className={INPUT_CLS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIELD_TYPE_META).map(([key, m]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                      {m.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div>
            <Label className={LABEL_CLS}>Label<span className="text-rose-500 ml-0.5">*</span></Label>
            <Input value={draft.label} onChange={e => setDraft(prev => ({ ...prev, label: e.target.value }))} placeholder="Field label" className={INPUT_CLS} />
          </div>

          {/* Placeholder */}
          {draft.type !== "section" && draft.type !== "checkbox" && draft.type !== "family_repeater" && (
            <div>
              <Label className={LABEL_CLS}>Placeholder</Label>
              <Input value={draft.placeholder} onChange={e => setDraft(prev => ({ ...prev, placeholder: e.target.value }))} placeholder="Placeholder text" className={INPUT_CLS} />
            </div>
          )}

          {/* Description */}
          <div>
            <Label className={LABEL_CLS}>Helper Text</Label>
            <Input value={draft.description} onChange={e => setDraft(prev => ({ ...prev, description: e.target.value }))} placeholder="Additional description shown below the field" className={INPUT_CLS} />
          </div>

          {/* Options */}
          {hasOptions && (
            <div>
              <Label className={LABEL_CLS}>Options</Label>
              <div className="space-y-2 mb-2">
                {draft.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">{opt}</div>
                    <button onClick={() => removeOption(idx)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={optionInput} onChange={e => setOptionInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addOption())}
                  placeholder="Add an option" className={INPUT_CLS} />
                <Button onClick={addOption} className="px-3 py-2 h-auto rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 flex-shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Layout & Required */}
          <div className="grid grid-cols-2 gap-4">
            {draft.type !== "section" && draft.type !== "family_repeater" && (
              <div>
                <Label className={LABEL_CLS}>Width</Label>
                <div className="flex gap-2">
                  {(["full", "half"] as const).map(w => (
                    <button key={w} onClick={() => setDraft(prev => ({ ...prev, width: w }))}
                      className={cn(
                        "flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-all capitalize",
                        draft.width === w ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                      )}>
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {draft.type !== "section" && (
              <div>
                <Label className={LABEL_CLS}>Required</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Switch checked={draft.required} onCheckedChange={v => setDraft(prev => ({ ...prev, required: v }))} />
                  <span className="text-xs text-slate-500">{draft.required ? "Required" : "Optional"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Validation */}
          {(draft.type === "text" || draft.type === "textarea") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={LABEL_CLS}>Min Length</Label>
                <Input type="number" value={draft.validation.minLength ?? ""} onChange={e => setDraft(prev => ({ ...prev, validation: { ...prev.validation, minLength: parseInt(e.target.value) || undefined } }))} placeholder="0" className={INPUT_CLS} />
              </div>
              <div>
                <Label className={LABEL_CLS}>Max Length</Label>
                <Input type="number" value={draft.validation.maxLength ?? ""} onChange={e => setDraft(prev => ({ ...prev, validation: { ...prev.validation, maxLength: parseInt(e.target.value) || undefined } }))} placeholder="500" className={INPUT_CLS} />
              </div>
            </div>
          )}
          {draft.type === "number" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={LABEL_CLS}>Min Value</Label>
                <Input type="number" value={draft.validation.min ?? ""} onChange={e => setDraft(prev => ({ ...prev, validation: { ...prev.validation, min: parseInt(e.target.value) || undefined } }))} placeholder="0" className={INPUT_CLS} />
              </div>
              <div>
                <Label className={LABEL_CLS}>Max Value</Label>
                <Input type="number" value={draft.validation.max ?? ""} onChange={e => setDraft(prev => ({ ...prev, validation: { ...prev.validation, max: parseInt(e.target.value) || undefined } }))} placeholder="120" className={INPUT_CLS} />
              </div>
            </div>
          )}

          {/* Conditional Logic */}
          {draft.type !== "section" && otherFields.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ToggleLeft className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-600">Conditional Logic</span>
                </div>
                <Switch
                  checked={!!draft.conditional}
                  onCheckedChange={v => setDraft(prev => ({
                    ...prev,
                    conditional: v ? { fieldId: otherFields[0]?.id ?? "", operator: "equals", value: "" } : null,
                  }))}
                />
              </div>
              {draft.conditional && (
                <div className="space-y-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-fade-in-up">
                  <p className="text-[10px] text-indigo-600 font-semibold">Show this field only when:</p>
                  <Select value={draft.conditional.fieldId} onValueChange={v => setDraft(prev => ({ ...prev, conditional: { ...prev.conditional!, fieldId: v } }))}>
                    <SelectTrigger className={cn(INPUT_CLS, "text-xs")}>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherFields.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={draft.conditional.operator} onValueChange={v => setDraft(prev => ({ ...prev, conditional: { ...prev.conditional!, operator: v as ConditionalRule["operator"] } }))}>
                      <SelectTrigger className={cn(INPUT_CLS, "text-xs")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="is_empty">Is empty</SelectItem>
                        <SelectItem value="is_not_empty">Is not empty</SelectItem>
                      </SelectContent>
                    </Select>
                    {!["is_empty", "is_not_empty"].includes(draft.conditional.operator) && (
                      <Input value={draft.conditional.value} onChange={e => setDraft(prev => ({ ...prev, conditional: { ...prev.conditional!, value: e.target.value } }))} placeholder="Value" className={cn(INPUT_CLS, "text-xs")} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button onClick={onCancel} variant="outline" className="px-4 py-2 h-auto rounded-xl text-sm">Cancel</Button>
          <Button onClick={() => onSave(draft)} disabled={!draft.label.trim()}
            className="px-5 py-2 h-auto rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
            <Check className="w-3.5 h-3.5 mr-1.5" /> Save Field
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Field Card (in the list) ─── */
function FieldCard({
  field,
  index,
  total,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
  onToggleRequired,
}: {
  field: FormField;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (dir: "up" | "down") => void;
  onToggleRequired: () => void;
}) {
  const meta = FIELD_TYPE_META[field.type] || FIELD_TYPE_META.text || { label: field.type || "Text", icon: Type, bg: "#f1f5f9", color: "#64748b" };
  const isSection = field.type === "section";

  if (isSection) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 group">
        <GripVertical className="w-4 h-4 text-slate-300 cursor-grab flex-shrink-0" />
        <SeparatorHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-700 truncate">{field.label}</p>
          {field.description && <p className="text-[10px] text-slate-400 truncate">{field.description}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onMove("up")} disabled={index === 0} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
          <button onClick={() => onMove("down")} disabled={index === total - 1} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
          <button onClick={onEdit} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><Pencil className="w-3 h-3" /></button>
          <button onClick={onDelete} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all group">
      <GripVertical className="w-4 h-4 text-slate-300 cursor-grab flex-shrink-0" />

      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
        <meta.icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-700 truncate">{field.label}</p>
          {field.required && <span className="text-rose-500 text-xs font-bold">*</span>}
          {field.conditional && (
            <Badge className="px-1.5 py-0 text-[8px] bg-amber-100 text-amber-700 border-none">Conditional</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge className="px-1.5 py-0 text-[8px] border-none" style={{ background: meta.bg, color: meta.color }}>{meta.label}</Badge>
          {field.width === "half" && <Badge className="px-1.5 py-0 text-[8px] bg-slate-100 text-slate-500 border-none">Half width</Badge>}
          {field.type === "select" || field.type === "radio" || field.type === "multiselect"
            ? <span className="text-[9px] text-slate-400">{field.options.length} options</span>
            : null}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onMove("up")} disabled={index === 0} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30" title="Move up"><ArrowUp className="w-3 h-3" /></button>
        <button onClick={() => onMove("down")} disabled={index === total - 1} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30" title="Move down"><ArrowDown className="w-3 h-3" /></button>
        <button onClick={onToggleRequired} className={cn("w-6 h-6 rounded flex items-center justify-center transition-all", field.required ? "text-rose-500 bg-rose-50" : "text-slate-400 hover:text-rose-500 hover:bg-rose-50")} title={field.required ? "Make optional" : "Make required"}>
          <span className="text-[10px] font-black">*</span>
        </button>
        <button onClick={onDuplicate} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Duplicate"><Copy className="w-3 h-3" /></button>
        <button onClick={onEdit} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Edit"><Pencil className="w-3 h-3" /></button>
        <button onClick={onDelete} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50" title="Delete"><Trash2 className="w-3 h-3" /></button>
      </div>
    </div>
  );
}

/* ─── Collapsible Section Component ─── */
export function CollapsibleFormSection({
  title,
  icon: Icon,
  description,
  defaultOpen = true,
  badge,
  children,
}: {
  title: string;
  icon?: any;
  description?: string;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all mb-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 bg-slate-50/90 hover:bg-slate-100/90 transition-colors text-left border-none cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-indigo-100/80 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              {title}
              {badge && (
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                  {badge}
                </span>
              )}
            </h4>
            {description && <p className="text-[10px] text-slate-400 mt-0.5">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400">
            {isOpen ? "Collapse" : "Expand"}
          </span>
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-100 animate-fade-in-up">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Live Preview ─── */
function LivePreview({ fields }: { fields: FormField[] }) {
  if (fields.length === 0) {
    return (
      <div className="text-center py-10">
        <Eye className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-400">Add fields to see preview</p>
      </div>
    );
  }

  // Group fields by section
  const sections: { sectionField: FormField | null; fields: FormField[] }[] = [];
  let currentSec: { sectionField: FormField | null; fields: FormField[] } = { sectionField: null, fields: [] };

  fields.forEach(f => {
    if (f.type === "section") {
      if (currentSec.sectionField || currentSec.fields.length > 0) {
        sections.push(currentSec);
      }
      currentSec = { sectionField: f, fields: [] };
    } else {
      currentSec.fields.push(f);
    }
  });
  if (currentSec.sectionField || currentSec.fields.length > 0) {
    sections.push(currentSec);
  }

  const renderSingleField = (field: FormField) => {
    const widthCls = field.width === "half" ? "w-[calc(50%-8px)]" : "w-full";

    if (field.type === "family_repeater") {
      return (
        <div key={field.id} className="w-full p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-bold text-indigo-600">{field.label}</span>
          </div>
          <p className="text-[10px] text-slate-400">Family members can be added dynamically</p>
        </div>
      );
    }

    if (field.type === "checkbox") {
      return (
        <div key={field.id} className={cn(widthCls)}>
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="w-4 h-4 rounded border-2 border-slate-300 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-slate-600">
              {field.label}
              {field.required && <span className="text-rose-500 ml-0.5">*</span>}
            </span>
          </label>
        </div>
      );
    }

    return (
      <div key={field.id} className={cn(widthCls)}>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
          {field.label}
          {field.required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        {field.type === "textarea" ? (
          <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-400 min-h-[60px]">
            {field.placeholder || "Enter text..."}
          </div>
        ) : field.type === "select" || field.type === "multiselect" ? (
          <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-400 flex items-center justify-between">
            <span>{field.placeholder || "Select..."}</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        ) : field.type === "radio" ? (
          <div className="space-y-2">
            {field.options.map(opt => (
              <label key={opt} className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                {opt}
              </label>
            ))}
          </div>
        ) : field.type === "file" ? (
          <div className="w-full px-4 py-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
            <Upload className="w-5 h-5 text-slate-300 mx-auto mb-1" />
            <p className="text-[10px] text-slate-400">Click to upload or drag & drop</p>
          </div>
        ) : (
          <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-400">
            {field.placeholder || "Enter value..."}
          </div>
        )}
        {field.description && <p className="text-[10px] text-slate-400 mt-1">{field.description}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {sections.map((sec, idx) => {
        const secTitle = sec.sectionField ? sec.sectionField.label : "General Details";
        const secDesc = sec.sectionField?.description;
        const secMeta = sec.sectionField ? FIELD_TYPE_META[sec.sectionField.type] : null;

        return (
          <CollapsibleFormSection
            key={sec.sectionField ? sec.sectionField.id : `sec_${idx}`}
            title={secTitle}
            icon={secMeta?.icon || FileText}
            description={secDesc}
            defaultOpen={true}
            badge={`${sec.fields.length} field${sec.fields.length !== 1 ? "s" : ""}`}
          >
            <div className="flex flex-wrap gap-x-4 gap-y-4">
              {sec.fields.map(field => renderSingleField(field))}
            </div>
          </CollapsibleFormSection>
        );
      })}
    </div>
  );
}

/* ─── Main Component ─── */
export function EventRegistrationFormBuilder({
  config,
  onChange,
}: {
  config: RegistrationFormConfig;
  onChange: (c: RegistrationFormConfig) => void;
}) {
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const updateFields = (fields: FormField[]) => onChange({ ...config, fields });

  const addField = (type: FieldType) => {
    const meta = FIELD_TYPE_META[type];
    const newField: FormField = {
      id: generateId(),
      type,
      label: type === "section" ? "New Section" : meta.label,
      placeholder: "",
      description: "",
      required: false,
      options: [],
      width: type === "section" || type === "family_repeater" ? "full" : "full",
      validation: {},
      conditional: null,
    };
    updateFields([...config.fields, newField]);
    if (type !== "section") {
      setEditingField(newField);
    }
    setShowAddField(false);
  };

  const addFromTemplate = (template: FieldTemplate) => {
    const newFields = template.fields.map(f => ({
      ...f,
      id: generateId(),
    })) as FormField[];
    updateFields([...config.fields, ...newFields]);
    setShowTemplates(false);
  };

  const saveField = (updated: FormField) => {
    updateFields(config.fields.map(f => f.id === updated.id ? updated : f));
    setEditingField(null);
  };

  const deleteField = (id: string) => {
    updateFields(config.fields.filter(f => f.id !== id));
  };

  const duplicateField = (field: FormField) => {
    const idx = config.fields.findIndex(f => f.id === field.id);
    const clone = { ...field, id: generateId(), label: `${field.label} (Copy)` };
    const newFields = [...config.fields];
    newFields.splice(idx + 1, 0, clone);
    updateFields(newFields);
  };

  const moveField = (id: string, dir: "up" | "down") => {
    const idx = config.fields.findIndex(f => f.id === id);
    if ((dir === "up" && idx === 0) || (dir === "down" && idx === config.fields.length - 1)) return;
    const newFields = [...config.fields];
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    [newFields[idx], newFields[swapIdx]] = [newFields[swapIdx], newFields[idx]];
    updateFields(newFields);
  };

  const toggleRequired = (id: string) => {
    updateFields(config.fields.map(f => f.id === id ? { ...f, required: !f.required } : f));
  };

  const fieldCount = config.fields.filter(f => f.type !== "section").length;
  const requiredCount = config.fields.filter(f => f.required).length;

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Registration Form Builder</h3>
              <p className="text-[10px] text-slate-400">Design the form your attendees will fill out</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="px-2 py-1 text-[10px] bg-indigo-50 text-indigo-600 border-none font-bold">
            {fieldCount} fields
          </Badge>
          <Badge className="px-2 py-1 text-[10px] bg-rose-50 text-rose-600 border-none font-bold">
            {requiredCount} required
          </Badge>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              showPreview ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
            )}
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Builder" : "Preview"}
          </button>
        </div>
      </div>

      {/* Quick templates */}
      {showTemplates && config.fields.length === 0 && (
        <div className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Quick Start Templates
            </p>
            <button onClick={() => setShowTemplates(false)} className="text-[10px] text-slate-400 hover:text-slate-600">
              Hide
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {FIELD_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => addFromTemplate(t)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                  <t.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-700">{t.label}</p>
                  <p className="text-[9px] text-slate-400">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Template chips (when fields exist) */}
      {config.fields.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Add Template</p>
          <div className="flex gap-1.5 flex-wrap">
            {FIELD_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => addFromTemplate(t)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-semibold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              >
                <t.icon className="w-3 h-3" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showPreview ? (
        /* Live Preview */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
            <Eye className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-bold text-slate-700">Form Preview</span>
            <span className="text-[10px] text-slate-400">— how registrants will see it</span>
          </div>
          <LivePreview fields={config.fields} />
        </div>
      ) : (
        /* Field list */
        <div className="space-y-2">
          {config.fields.map((field, idx) => (
            <FieldCard
              key={field.id}
              field={field}
              index={idx}
              total={config.fields.length}
              onEdit={() => setEditingField(field)}
              onDelete={() => deleteField(field.id)}
              onDuplicate={() => duplicateField(field)}
              onMove={dir => moveField(field.id, dir)}
              onToggleRequired={() => toggleRequired(field.id)}
            />
          ))}

          {config.fields.length === 0 && !showTemplates && (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">No fields yet</p>
              <p className="text-xs text-slate-400 mt-1">Add fields from templates above or create custom ones below</p>
            </div>
          )}
        </div>
      )}

      {/* Add field section */}
      {!showPreview && (
        <div>
          {showAddField ? (
            <div className="animate-fade-in-up p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-600">Add Custom Field</p>
                <button onClick={() => setShowAddField(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {Object.entries(FIELD_TYPE_META).map(([key, m]) => (
                  <button
                    key={key}
                    onClick={() => addField(key as FieldType)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-center group"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors group-hover:scale-110" style={{ background: m.bg }}>
                      <m.icon className="w-4 h-4" style={{ color: m.color }} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 group-hover:text-slate-700 leading-tight">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddField(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Custom Field
            </button>
          )}
        </div>
      )}

      {/* Form settings */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-indigo-500" /> Form Settings
        </p>

        <div className={cn(
          "flex items-center justify-between p-3 rounded-xl border transition-all",
          config.allowFamilyRegistration ? "bg-indigo-50/50 border-indigo-200" : "bg-slate-50 border-slate-100"
        )}>
          <div>
            <span className="text-xs font-medium text-slate-700">Allow family registration</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Registrants can add family members</p>
          </div>
          <Switch checked={config.allowFamilyRegistration} onCheckedChange={v => onChange({ ...config, allowFamilyRegistration: v })} />
        </div>

        {config.allowFamilyRegistration && (
          <div className="animate-fade-in-up pl-4">
            <Label className={LABEL_CLS}>Max Family Members</Label>
            <Input
              type="number" min={1} max={20}
              value={config.maxFamilyMembers}
              onChange={e => onChange({ ...config, maxFamilyMembers: parseInt(e.target.value) || 5 })}
              className={cn(INPUT_CLS, "w-32")}
            />
          </div>
        )}

        <div>
          <Label className={LABEL_CLS}>Confirmation Message</Label>
          <Textarea
            value={config.confirmationMessage}
            onChange={e => onChange({ ...config, confirmationMessage: e.target.value })}
            placeholder="Thank you for registering! A confirmation will be sent to your email."
            className={cn(INPUT_CLS, "min-h-[60px]")}
            rows={2}
          />
        </div>
      </div>

      {/* Field editor modal */}
      {editingField && (
        <FieldEditor
          field={editingField}
          allFields={config.fields}
          onSave={saveField}
          onCancel={() => setEditingField(null)}
        />
      )}
    </div>
  );
}

/* ─── Default config helper ─── */
export const DEFAULT_REGISTRATION_FORM_CONFIG: RegistrationFormConfig = {
  fields: [],
  allowFamilyRegistration: true,
  maxFamilyMembers: 5,
  confirmationMessage: "Thank you for registering! A confirmation email will be sent to you shortly.",
  collectPayment: false,
};

export const GANESH_CHATURTHI_FORM_CONFIG: RegistrationFormConfig = {
  fields: [
    { id: "gc_s1", type: "section", label: "Personal Details", placeholder: "", description: "Primary attendee registration details", required: false, options: [], width: "full", validation: {}, conditional: null },
    { id: "gc_f1", type: "text", label: "First Name", placeholder: "Enter first name", description: "", required: true, options: [], width: "half", validation: {}, conditional: null },
    { id: "gc_f2", type: "text", label: "Last Name", placeholder: "Enter last name", description: "", required: true, options: [], width: "half", validation: {}, conditional: null },
    { id: "gc_f3", type: "number", label: "Age", placeholder: "e.g. 32", description: "", required: true, options: [], width: "half", validation: { min: 0, max: 120 }, conditional: null },
    { id: "gc_f4", type: "select", label: "Gender", placeholder: "Select gender", description: "", required: true, options: ["Male", "Female", "Other", "Prefer not to say"], width: "half", validation: {}, conditional: null },

    { id: "gc_s2", type: "section", label: "Contact & Address", placeholder: "", description: "Required for entry pass distribution & updates", required: false, options: [], width: "full", validation: {}, conditional: null },
    { id: "gc_f5", type: "email", label: "Email Address", placeholder: "your@email.com", description: "Digital entry pass & slot confirmation will be sent here", required: true, options: [], width: "full", validation: {}, conditional: null },
    { id: "gc_f6", type: "phone", label: "Mobile Number", placeholder: "+91 98765 43210", description: "", required: true, options: [], width: "full", validation: {}, conditional: null },
    { id: "gc_f7", type: "text", label: "Flat / Villa No & Street", placeholder: "Flat / Villa number & street address", description: "", required: true, options: [], width: "full", validation: {}, conditional: null },
    { id: "gc_f8", type: "text", label: "Community Wing / Tower", placeholder: "e.g. Tower B, Flat 402", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
    { id: "gc_f9", type: "text", label: "Pincode", placeholder: "400069", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },

    { id: "gc_s3", type: "section", label: "Puja, Aarti & Meal Preferences", placeholder: "", description: "Choose your preferred time slots & mahaprasadam passes", required: false, options: [], width: "full", validation: {}, conditional: null },
    { id: "gc_f10", type: "select", label: "Preferred Aarti Slot", placeholder: "Select Aarti slot", description: "Slot allocation ensures smooth crowd management at the Pandal", required: true, options: [
      "Morning Inaugural Aarti (08:00 AM - 09:00 AM)",
      "Afternoon Mahapooja & Aarti (12:30 PM - 01:30 PM)",
      "Evening Grand Aarti & Dhoop (07:00 PM - 08:30 PM)",
      "Late Night Stotram & Bhajan Aarti (09:30 PM - 10:30 PM)",
    ], width: "half", validation: {}, conditional: null },
    { id: "gc_f11", type: "select", label: "Mahaprasadam Meal Pass Count", placeholder: "Select meal pass count", description: "Pure vegetarian Mahaprasadam served daily", required: true, options: [
      "1 Pass (Self Only)",
      "2 Passes (Self + 1)",
      "3 Passes (Self + 2)",
      "4 Passes (Family of 4)",
      "5 Passes (Family of 5)",
      "6+ Family Passes",
    ], width: "half", validation: {}, conditional: null },
    { id: "gc_f12", type: "select", label: "Cultural Program Participation", placeholder: "Select event activity", description: "Register for festival stage performances", required: false, options: [
      "None / Audience Only",
      "Classical Dance (Bharatanatyam / Kathak)",
      "Devotional Bhajan / Group Singing",
      "Kids Drawing & Craft Competition",
      "Rangoli & Floral Art Contest",
      "Dhol Tasha / Cultural Music Troupe",
    ], width: "half", validation: {}, conditional: null },
    { id: "gc_f13", type: "radio", label: "Volunteer Interest", placeholder: "", description: "Would you like to assist our festival organizing committee?", required: false, options: [
      "Prasadam Distribution",
      "Pandal & Stage Decoration",
      "Crowd Control & Gate Management",
      "Visarjan Procession Team",
      "Medical & First Aid Desk",
      "Not Volunteering",
    ], width: "half", validation: {}, conditional: null },

    { id: "gc_s4", type: "section", label: "Family Members Registration", placeholder: "", description: "Add family members attending the festival with you", required: false, options: [], width: "full", validation: {}, conditional: null },
    {
      id: "gc_f14", type: "family_repeater", label: "Family Members", placeholder: "", description: "Include details of all family members for gate pass generation",
      required: false, options: [], width: "full", validation: {}, conditional: null,
      familyFields: [
        { id: "gc_fm_name", type: "text", label: "Full Name", placeholder: "Full name", description: "", required: true, options: [], width: "half", validation: {}, conditional: null },
        { id: "gc_fm_age", type: "number", label: "Age", placeholder: "Age", description: "", required: true, options: [], width: "half", validation: { min: 0, max: 120 }, conditional: null },
        { id: "gc_fm_gender", type: "select", label: "Gender", placeholder: "Select gender", description: "", required: true, options: ["Male", "Female", "Other"], width: "half", validation: {}, conditional: null },
        { id: "gc_fm_rel", type: "select", label: "Relationship", placeholder: "Select relation", description: "", required: true, options: ["Spouse", "Child", "Parent", "Sibling", "Relative", "Other"], width: "half", validation: {}, conditional: null },
      ],
    },

    { id: "gc_s5", type: "section", label: "Emergency Contact", placeholder: "", description: "In case of emergency during festival events", required: false, options: [], width: "full", validation: {}, conditional: null },
    { id: "gc_f15", type: "text", label: "Emergency Contact Name", placeholder: "Contact person name", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
    { id: "gc_f16", type: "phone", label: "Emergency Contact Phone", placeholder: "+91 98765 43210", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },

    { id: "gc_s6", type: "section", label: "Consent & Guidelines", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
    { id: "gc_f17", type: "checkbox", label: "I agree to abide by the festival safety, eco-friendly Visarjan guidelines and community code of conduct.", placeholder: "", description: "", required: true, options: [], width: "full", validation: {}, conditional: null },
    { id: "gc_f18", type: "checkbox", label: "I consent to official photography and video recording during Ganesh Utsav 2026 celebrations.", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
  ],
  allowFamilyRegistration: true,
  maxFamilyMembers: 6,
  confirmationMessage: "Jai Ganesh! Thank you for registering for Ganesh Chaturthi Grand Festival 2026. Your official gate pass & Aarti slot confirmation details have been generated.",
  collectPayment: false,
};
