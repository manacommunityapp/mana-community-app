import { useEffect, useState, type FormEvent } from "react";
import { Building2, CheckCircle2, Clock3, Loader2, Store } from "lucide-react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { vendorCategoryService, vendorRegistrationService } from "../../../../services/vendor/vendorService";
import type { VendorCategoryResponse, VendorRegistrationRequest, VendorRegistrationResponse } from "../../../../types/api";
import { showError, showSuccess } from "../../../../utils/ToastUtils";

const initialForm: VendorRegistrationRequest = {
  businessName: "", contactName: "", contactEmail: "", contactPhone: "", categoryId: 0,
  businessType: "INDIVIDUAL", description: "", address: "", city: "", state: "", pincode: "",
  gstNumber: "", panNumber: "",
};

export function VendorApplication() {
  const [categories, setCategories] = useState<VendorCategoryResponse[]>([]);
  const [form, setForm] = useState<VendorRegistrationRequest>(initialForm);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingApplication, setLoadingApplication] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<VendorRegistrationResponse | null>(null);

  useEffect(() => {
    vendorCategoryService.getCategories()
      .then((rows) => setCategories(rows.filter((category) => category.active)))
      .catch(() => showError("Could not load vendor categories"))
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    vendorRegistrationService.getMyRegistrations()
      .then((rows) => setApplication(rows[0] ?? null))
      .catch(() => undefined)
      .finally(() => setLoadingApplication(false));
  }, []);

  function update<K extends keyof VendorRegistrationRequest>(key: K, value: VendorRegistrationRequest[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.categoryId) {
      showError("Choose a business category");
      return;
    }
    setSubmitting(true);
    try {
      setApplication(await vendorRegistrationService.submitRegistration(form));
      showSuccess("Your vendor application was submitted for community review");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not submit vendor application");
    } finally {
      setSubmitting(false);
    }
  }

  if (application && ["PENDING", "APPROVED", "CONVERTED"].includes(application.status)) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-8">
        <Card>
          <CardHeader>
            <div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full ${application.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
              {application.status === "PENDING" ? <Clock3 className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
            </div>
            <CardTitle>{application.status === "PENDING" ? "Application under review" : "Vendor application approved"}</CardTitle>
            <CardDescription>{application.status === "PENDING" ? "Your community administrator will review the business details. Vendor access is enabled after approval." : "Your vendor profile is ready. Vendor tools are enabled for your account."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm"><p><span className="text-muted-foreground">Business:</span> {application.businessName}</p><p><span className="text-muted-foreground">Category:</span> {application.categoryName ?? "—"}</p><p><span className="text-muted-foreground">Submitted:</span> {new Date(application.createdAt).toLocaleDateString()}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><Building2 className="h-6 w-6" /> Become a community vendor</h1>
        <p className="mt-1 text-sm text-muted-foreground">Submit your business for review. An administrator will approve it before vendor tools are activated.</p>
      </div>
      {application?.status === "REJECTED" && <Card className="border-red-200 bg-red-50"><CardContent className="pt-5 text-sm text-red-900"><strong>Your previous application was rejected.</strong>{application.rejectionReason ? <p className="mt-1">{application.rejectionReason}</p> : null}<p className="mt-1 text-red-800">You can submit a corrected application below.</p></CardContent></Card>}
      <Card>
        <CardHeader><CardTitle>Business application</CardTitle><CardDescription>Provide accurate business and contact details for the review team.</CardDescription></CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium">Business name<Input required maxLength={200} value={form.businessName} onChange={(e) => update("businessName", e.target.value)} /></label>
              <label className="space-y-1.5 text-sm font-medium">Category
                <select required disabled={loadingCategories || categories.length === 0} value={form.categoryId || ""} onChange={(e) => update("categoryId", Number(e.target.value))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">{loadingCategories ? "Loading categories…" : "Choose a category"}</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium">Business type
                <select value={form.businessType} onChange={(e) => update("businessType", e.target.value as VendorRegistrationRequest["businessType"])} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="INDIVIDUAL">Individual</option><option value="PROPRIETORSHIP">Proprietorship</option><option value="PARTNERSHIP">Partnership</option><option value="COMPANY">Company</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium">Contact name<Input required maxLength={150} value={form.contactName} onChange={(e) => update("contactName", e.target.value)} /></label>
              <label className="space-y-1.5 text-sm font-medium">Contact email<Input required type="email" maxLength={150} value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} /></label>
              <label className="space-y-1.5 text-sm font-medium">Contact phone<Input required type="tel" maxLength={20} value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} /></label>
              <label className="space-y-1.5 text-sm font-medium">GST number (optional)<Input maxLength={30} value={form.gstNumber} onChange={(e) => update("gstNumber", e.target.value)} /></label>
              <label className="space-y-1.5 text-sm font-medium">PAN (optional)<Input maxLength={20} value={form.panNumber} onChange={(e) => update("panNumber", e.target.value)} /></label>
              <label className="space-y-1.5 text-sm font-medium sm:col-span-2">Business address<Input maxLength={500} value={form.address} onChange={(e) => update("address", e.target.value)} /></label>
              <label className="space-y-1.5 text-sm font-medium">City<Input maxLength={100} value={form.city} onChange={(e) => update("city", e.target.value)} /></label>
              <label className="space-y-1.5 text-sm font-medium">State<Input maxLength={100} value={form.state} onChange={(e) => update("state", e.target.value)} /></label>
              <label className="space-y-1.5 text-sm font-medium">PIN code<Input maxLength={10} value={form.pincode} onChange={(e) => update("pincode", e.target.value)} /></label>
              <label className="space-y-1.5 text-sm font-medium sm:col-span-2">Business description<Textarea maxLength={2000} rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} /></label>
            </div>
            <Button type="submit" disabled={submitting || loadingApplication || loadingCategories || categories.length === 0}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : "Submit application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
