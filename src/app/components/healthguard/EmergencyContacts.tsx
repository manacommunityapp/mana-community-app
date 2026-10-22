import { useState, useEffect } from 'react';
import { Plus, Trash2, Phone, Edit2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { healthGuardService } from '../../../services/healthguard/healthGuardService';
import type { EmergencyContactDto, ContactRelationship } from '../../../types/healthguard';

const RELATIONSHIPS: { value: ContactRelationship; label: string }[] = [
  { value: 'SPOUSE', label: 'Spouse' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'CHILD', label: 'Child' },
  { value: 'SIBLING', label: 'Sibling' },
  { value: 'FRIEND', label: 'Friend' },
  { value: 'NEIGHBOR', label: 'Neighbor' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'CAREGIVER', label: 'Caregiver' },
  { value: 'OTHER', label: 'Other' },
];

const BLANK: Partial<EmergencyContactDto> = {
  name: '', phone: '', email: '', relationship: 'OTHER',
  priority: 1, notifyOnSos: true, notifyOnAlert: true,
};

export function EmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContactDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<EmergencyContactDto>>({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    healthGuardService.getContacts()
      .then(r => setContacts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.name?.trim() || !form.phone?.trim()) return;
    setSaving(true);
    try {
      if (editId != null) {
        const res = await healthGuardService.updateContact(editId, form as EmergencyContactDto);
        setContacts(prev => prev.map(c => c.id === editId ? res.data : c));
      } else {
        const res = await healthGuardService.addContact(form as EmergencyContactDto);
        setContacts(prev => [...prev, res.data]);
      }
      setShowForm(false);
      setEditId(null);
      setForm({ ...BLANK });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c: EmergencyContactDto) => {
    setForm({ ...c });
    setEditId(c.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await healthGuardService.deleteContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ ...BLANK });
  };

  if (loading) return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Loading contacts...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Emergency Contacts</h1>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Add Contact
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{editId ? 'Edit Contact' : 'New Emergency Contact'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name *</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Contact name"
                  value={form.name ?? ''}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone *</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="+91-XXXXXXXXXX"
                  value={form.phone ?? ''}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="email@example.com"
                  value={form.email ?? ''}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Relationship</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={form.relationship ?? 'OTHER'}
                  onChange={e => setForm(f => ({ ...f, relationship: e.target.value as ContactRelationship }))}
                >
                  {RELATIONSHIPS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority (1 = highest)</label>
                <input
                  type="number" min={1} max={10}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={form.priority ?? 1}
                  onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.notifyOnSos ?? true} onChange={e => setForm(f => ({ ...f, notifyOnSos: e.target.checked }))} />
                Notify on SOS
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.notifyOnAlert ?? true} onChange={e => setForm(f => ({ ...f, notifyOnAlert: e.target.checked }))} />
                Notify on Alerts
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSave} disabled={saving || !form.name?.trim() || !form.phone?.trim()} className="gap-1">
                <Check className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save Contact'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact List */}
      {contacts.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Phone className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No emergency contacts yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Add people who should be notified in an emergency</p>
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1">
              <Plus className="h-4 w-4" /> Add First Contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contacts.map((c, idx) => (
            <Card key={c.id} className="border hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">#{idx + 1}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px]">{c.relationship}</Badge>
                      {c.notifyOnSos && <Badge variant="outline" className="text-[10px] border-red-200 text-red-600 bg-red-50">SOS</Badge>}
                      {c.consentGiven && <Badge variant="outline" className="text-[10px] border-green-200 text-green-600 bg-green-50">Consented</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(c)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => c.id && handleDelete(c.id)}
                    disabled={deletingId === c.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
