import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Save, Settings } from "lucide-react";
import type { RestaurantSettings } from "@/types/billing";
import { defaultRestaurantSettings, getMyRestaurant, updateRestaurantSettings } from "@/lib/posApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

export default function SettingsScreen() {
  const [settings, setSettings] = useState<RestaurantSettings>(defaultRestaurantSettings);
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const restaurant = await getMyRestaurant();
        if (restaurant) setSettings(restaurant);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Supabase settings are not available yet.");
      }
    }

    loadSettings();
  }, []);

  function updateField<K extends keyof RestaurantSettings>(field: K, value: RestaurantSettings[K]) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const saved = await updateRestaurantSettings(settings);
      setSettings(saved);
      setNotice("Restaurant settings saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save restaurant settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-6">
      <header className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5">
          <Logo size="sm" className="shadow-sm" />
          <div>
            <h1 className="font-serif text-lg font-bold">Restaurant Settings</h1>
            <p className="text-xs font-semibold text-white/75">Bill header, tax, service charge, and currency</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        {notice && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {notice}
          </div>
        )}

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-lg font-bold">Business Details</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Restaurant name">
              <Input value={settings.name} onChange={(event) => updateField("name", event.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={settings.phone} onChange={(event) => updateField("phone", event.target.value)} />
            </Field>
            <Field label="Address">
              <Input value={settings.address} onChange={(event) => updateField("address", event.target.value)} />
            </Field>
            <Field label="GSTIN">
              <Input value={settings.gstin} onChange={(event) => updateField("gstin", event.target.value)} />
            </Field>
            <Field label="Logo URL">
              <Input value={settings.logoUrl} onChange={(event) => updateField("logoUrl", event.target.value)} placeholder="/restaurant-logo.jpg" />
            </Field>
            <Field label="Currency">
              <Input value={settings.currency} onChange={(event) => updateField("currency", event.target.value.toUpperCase())} placeholder="INR" />
            </Field>
            <Field label="Tax rate %">
              <Input type="number" min="0" max="100" value={settings.taxRate} onChange={(event) => updateField("taxRate", Number(event.target.value))} />
            </Field>
            <Field label="Service charge %">
              <Input type="number" min="0" max="100" value={settings.serviceChargeRate} onChange={(event) => updateField("serviceChargeRate", Number(event.target.value))} />
            </Field>
          </div>

          <Button className="mt-5 w-full md:w-auto" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
