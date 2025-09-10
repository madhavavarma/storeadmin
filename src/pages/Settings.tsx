import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { supabase } from "@/supabaseClient";
import { getAppSettings } from "./api";
import type { IAppSettings } from "@/interfaces/IAppSettings";

export default function Settings() {
  const [settings, setSettings] = useState<IAppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setIsLoggedIn(true);
        getAppSettings()
          .then((data: IAppSettings) => {
            setSettings(data || {});
            setLoading(false);
          })
          .catch(() => {
            setError("Failed to load settings");
            setLoading(false);
          });
      } else {
        setIsLoggedIn(false);
        setSettings(null);
        setLoading(false);
      }
    });
  }, []);

  // Handle changes (top-level + nested)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!settings) return;
    const { name, value, dataset } = e.target;

    // Logo
    if (name === "logoUrl") {
      setSettings({ ...settings, logoUrl: value });
      return;
    }

    // Branding
    if (dataset.section === "branding") {
      setSettings({
        ...settings,
        branding: { ...settings.branding, [name]: value },
      });
      return;
    }

    // Menu
    if (dataset.section === "menu") {
      setSettings({
        ...settings,
        branding: {
          ...settings.branding,
          menu: { ...settings.branding?.menu, [name]: value },
        },
      });
      return;
    }

    // Nav
    if (dataset.section === "nav") {
      const navType = dataset.navtype as "contact" | "faq";
      const idx = Number(dataset.idx);
      const field = dataset.field;
      const navArr = settings.branding?.nav?.[navType]?.map((item, i) =>
        i === idx ? { ...item, [field!]: value } : item
      );
      setSettings({
        ...settings,
        branding: {
          ...settings.branding,
          nav: { ...settings.branding?.nav, [navType]: navArr },
        },
      });
      return;
    }

    // Slides, features, carousels
    if (
      dataset.section === "slides" ||
      dataset.section === "features" ||
      dataset.section === "homeCarousels"
    ) {
      const arrName = dataset.section as
        | "slides"
        | "features"
        | "homeCarousels";
      const idx = Number(dataset.idx);
      const field = dataset.field;
      const arr = (settings.branding?.[arrName] || []).map((item, i) =>
        i === idx ? { ...item, [field!]: value } : item
      );
      setSettings({
        ...settings,
        branding: { ...settings.branding, [arrName]: arr },
      });
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const { error } = await supabase.from("branding").insert([{ data: settings }]);
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-green-600 mb-3"></div>
        <span className="text-green-700 font-medium text-lg">
          Loading settings...
        </span>
      </div>
    );
  }

  if (isLoggedIn === false) {
    return (
      <div className="p-8 text-center text-gray-500">
        Please log in to view settings.
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 w-full space-y-6">
      <h2 className="text-2xl font-bold">App Settings</h2>

      <Card className="p-0 w-full border-none shadow-none bg-transparent">
        <Accordion type="multiple" className="w-full space-y-2">
          {/* Logo */}
          <AccordionItem value="logo" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-2 font-semibold">
              Logo
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-2">
              <Input
                name="logoUrl"
                value={settings?.logoUrl || ""}
                onChange={handleChange}
                placeholder="Logo URL"
                disabled={!settings}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Branding */}
          <AccordionItem value="branding" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-2 font-semibold">
              Branding
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-3">
              {["siteTitle", "welcomeText", "tagline"].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {field}
                  </label>
                  <Input
                    name={field}
                    value={(settings?.branding as any)?.[field] || ""}
                    onChange={handleChange}
                    placeholder={field}
                    data-section="branding"
                  />
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Menu */}
          <AccordionItem value="menu" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-2 font-semibold">
              Menu
            </AccordionTrigger>
            <AccordionContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {(["home", "products", "about"] as const).map((key) => (
                <Input
                  key={key}
                  name={key}
                  value={settings?.branding?.menu?.[key] || ""}
                  onChange={handleChange}
                  placeholder={key}
                  data-section="menu"
                />
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Nav */}
          <AccordionItem value="nav" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-2 font-semibold">
              Nav (Contact & FAQ)
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-4">
              {(["contact", "faq"] as const).map((navType) => (
                <div key={navType}>
                  <h4 className="text-sm font-semibold mb-2">
                    {navType.toUpperCase()}
                  </h4>
                  {(settings?.branding?.nav?.[navType] || []).map(
                    (item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2"
                      >
                        {["title", "href", "description"].map((field) => (
                          <Input
                            key={field}
                            value={item[field] || ""}
                            onChange={handleChange}
                            placeholder={field}
                            data-section="nav"
                            data-navtype={navType}
                            data-idx={idx}
                            data-field={field}
                          />
                        ))}
                      </div>
                    )
                  )}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Slides */}
          <AccordionItem value="slides" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-2 font-semibold">
              Slides
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-2">
              {(settings?.branding?.slides || []).map((slide, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2"
                >
                  {["image", "headerText", "contentText"].map((field) => (
                    <Input
                      key={field}
                      value={(slide as any)[field] || ""}
                      onChange={handleChange}
                      placeholder={field}
                      data-section="slides"
                      data-idx={idx}
                      data-field={field}
                    />
                  ))}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Features */}
          <AccordionItem value="features" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-2 font-semibold">
              Features
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-2">
              {(settings?.branding?.features || []).map((feature, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2"
                >
                  {["title", "description", "icon"].map((field) => (
                    <Input
                      key={field}
                      value={(feature as any)[field] || ""}
                      onChange={handleChange}
                      placeholder={field}
                      data-section="features"
                      data-idx={idx}
                      data-field={field}
                    />
                  ))}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Home Carousels */}
          <AccordionItem value="homeCarousels" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-2 font-semibold">
              Home Carousels
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-2">
              {(settings?.branding?.homeCarousels || []).map((carousel, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2"
                >
                  {["heading", "label"].map((field) => (
                    <Input
                      key={field}
                      value={(carousel as any)[field] || ""}
                      onChange={handleChange}
                      placeholder={field}
                      data-section="homeCarousels"
                      data-idx={idx}
                      data-field={field}
                    />
                  ))}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving || !settings}
        className="w-full"
      >
        {saving ? "Saving..." : "Save Settings"}
      </Button>

      {success && <div className="text-green-600 text-sm">Settings saved!</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}
