"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "bn" | "es";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav Items
    "nav.home": "Home",
    "nav.records": "Medical Records",
    "nav.timeline": "Medical Timeline",
    "nav.copilot": "Clinical AI",
    "nav.meds": "Medications",
    "nav.appointments": "Appointments",
    "nav.analytics": "Health Analytics",
    "nav.chronic_care": "Chronic Care",
    "nav.screenings": "Health Screenings",
    "nav.profile": "Health Profile",
    "nav.settings": "Settings",
    "nav.short_records": "Records",
    "nav.short_copilot": "AI",
    "nav.short_meds": "Meds",
    "nav.short_chronic": "Chronic Care",

    // Common Actions
    "action.save": "Save",
    "action.saved": "Settings successfully saved.",
    "action.cancel": "Cancel",
    "action.export": "Export Complete Health Record (JSON)",
    "action.upload": "Upload Document",
    "action.search": "Search records, medications...",
    "action.view": "View",
    "action.edit": "Edit",
    "action.delete": "Delete",
    "action.confirm": "Confirm",
    "action.back": "Back",
    "action.close": "Close",

    // Settings Page
    "settings.title": "Settings & Preferences",
    "settings.subtitle": "Configure AI explanation depth, dark mode, language & export health records.",
    "settings.theme_group": "Theme & Appearance",
    "settings.theme_light": "Light Mode",
    "settings.theme_dark": "Dark Mode",
    "settings.theme_system": "System Default",
    "settings.theme_desc": "Choose between a crisp bright view or eye-friendly dark mode.",
    "settings.ai_depth_group": "AI Explanation Complexity",
    "settings.ai_simple_label": "Layman / Plain Language",
    "settings.ai_simple_desc": "Clear, conversational explanations with simple everyday analogies.",
    "settings.ai_balanced_label": "Balanced (Recommended)",
    "settings.ai_balanced_desc": "Clear explanations alongside exact clinical biomarker names and values.",
    "settings.ai_detailed_label": "Clinical & Detailed",
    "settings.ai_detailed_desc": "In-depth physiological explanations and medical terminology.",
    "settings.lang_group": "Language & Regional Standards",
    "settings.display_lang": "Display Language",
    "settings.units_format": "Lab Units Format",
    "settings.units_val": "US Standard (mg/dL, mmHg)",
    "settings.reminders_group": "Reminders & Alerts",
    "settings.notif_meds_label": "Medication Dosing Reminders",
    "settings.notif_meds_desc": "Alerts for morning (08:00) and evening (20:00) doses.",
    "settings.notif_apts_label": "Appointment Reminders",
    "settings.notif_apts_desc": "Alerts 24 hours prior to scheduled visits.",
    "settings.data_group": "Data Ownership & Portability",
    "settings.data_desc": "Download an encrypted, structured JSON archive containing your entire personal health life record, verified laboratory values, and prescriptions.",

    // Dashboard & General
    "dashboard.greeting": "Welcome back",
    "dashboard.active_conditions": "Active Chronic Conditions",
    "dashboard.upcoming_doses": "Today's Medication Doses",
    "dashboard.recent_records": "Recent Medical Records",
    "dashboard.clinical_alerts": "Clinical Insights & Alerts",
  },
  bn: {
    // Nav Items (বাংলা)
    "nav.home": "মূলপাতা",
    "nav.records": "মেডিকেল রেকর্ডস",
    "nav.timeline": "চিকিৎসা টাইমলাইন",
    "nav.copilot": "ক্লিনিক্যাল এআই",
    "nav.meds": "ওষুধ ও প্রেসক্রিপশন",
    "nav.appointments": "ডাক্তারের অ্যাপয়েন্টমেন্ট",
    "nav.analytics": "স্বাস্থ্য বিশ্লেষণ",
    "nav.chronic_care": "ক্রনিক কেয়ার",
    "nav.screenings": "স্বাস্থ্য স্ক্রিনিং",
    "nav.profile": "স্বাস্থ্য প্রোফাইল",
    "nav.settings": "সেটিংস",
    "nav.short_records": "রেকর্ডস",
    "nav.short_copilot": "এআই",
    "nav.short_meds": "ওষুধ",
    "nav.short_chronic": "ক্রনিক কেয়ার",

    // Common Actions
    "action.save": "সংরক্ষণ করুন",
    "action.saved": "সেটিংস সফলভাবে সংরক্ষিত হয়েছে।",
    "action.cancel": "বাতিল",
    "action.export": "সম্পূর্ণ স্বাস্থ্য রেকর্ড ডাউনলোড (JSON)",
    "action.upload": "ডকুমেন্ট আপলোড",
    "action.search": "রেকর্ড, ওষুধ খুঁজুন...",
    "action.view": "দেখুন",
    "action.edit": "সম্পাদনা",
    "action.delete": "মুছে ফেলুন",
    "action.confirm": "নিশ্চিত করুন",
    "action.back": "ফিরে যান",
    "action.close": "বন্ধ করুন",

    // Settings Page (বাংলা)
    "settings.title": "সেটিংস ও পছন্দসমূহ",
    "settings.subtitle": "এআই ব্যাখ্যার জটিলতা, ডার্ক মোড, ভাষা ও সম্পূর্ণ স্বাস্থ্য তথ্য ডাউনলোড কনফিগার করুন।",
    "settings.theme_group": "থিম ও ডিসপ্লে মোড",
    "settings.theme_light": "লাইট মোড (আলো)",
    "settings.theme_dark": "ডার্ক মোড (অন্ধকার)",
    "settings.theme_system": "সিস্টেম ডিফল্ট",
    "settings.theme_desc": "উজ্জ্বল ডিসপ্লে অথবা চোখের জন্য আরামদায়ক ডার্ক মোড নির্বাচন করুন।",
    "settings.ai_depth_group": "এআই ব্যাখ্যার ধরন ও গভীরতা",
    "settings.ai_simple_label": "সহজ ও সাধারণ ভাষা",
    "settings.ai_simple_desc": "সহজবোধ্য দৈনন্দিন উদাহরণের মাধ্যমে সহজ বাংলায় ব্যাখ্যা।",
    "settings.ai_balanced_label": "ভারসাম্যপূর্ণ (প্রস্তাবিত)",
    "settings.ai_balanced_desc": "ক্লিনিক্যাল বায়োমার্কার মান ও সহজবোধ্য ব্যাখ্যার সমন্বয়।",
    "settings.ai_detailed_label": "বিস্তারিত ও ক্লিনিক্যাল তথ্য",
    "settings.ai_detailed_desc": "গভীর চিকিৎসাবিজ্ঞান শব্দাবলী ও শারীরবৃত্তীয় বিশ্লেষণ।",
    "settings.lang_group": "ভাষা ও আঞ্চলিক মান",
    "settings.display_lang": "ডিসপ্লে ভাষা",
    "settings.units_format": "ল্যাব ইউনিটের ফরম্যাট",
    "settings.units_val": "আন্তর্জাতিক মান (mg/dL, mmHg)",
    "settings.reminders_group": "রিমাইন্ডার ও অ্যালার্ট",
    "settings.notif_meds_label": "ওষুধ সেবনের সময়সূচি রিমাইন্ডার",
    "settings.notif_meds_desc": "সকাল (০৮:০০) এবং রাতের (২০:০০) ডোজের জন্য স্বয়ংক্রিয় অ্যালার্ট।",
    "settings.notif_apts_label": "ডাক্তারের অ্যাপয়েন্টমেন্ট রিমাইন্ডার",
    "settings.notif_apts_desc": "অ্যাপয়েন্টমেন্টের ২৪ ঘণ্টা পূর্বে বিজ্ঞপ্তি প্রদান।",
    "settings.data_group": "ডেটা মালিকানা ও ব্যাকআপ ডাউনলোড",
    "settings.data_desc": "আপনার সকল স্বাস্থ্য বিবরণ, যাচাইকৃত ল্যাব ফলাফল এবং ওষুধসূচির একটি সুরক্ষিত, এনক্রিপ্ট করা JSON ফাইল ডাউনলোড করুন।",

    // Dashboard & General
    "dashboard.greeting": "স্বাগতম",
    "dashboard.active_conditions": "সক্রিয় দীর্ঘস্থায়ী রোগসমূহ",
    "dashboard.upcoming_doses": "আজকের ওষুধ সেবনের তালিকা",
    "dashboard.recent_records": "সাম্প্রতিক মেডিকেল রিপোর্ট",
    "dashboard.clinical_alerts": "চিকিৎসা সংক্রান্ত পর্যবেক্ষণ ও সতর্কতা",
  },
  es: {
    // Nav Items (Español)
    "nav.home": "Inicio",
    "nav.records": "Historial Médico",
    "nav.timeline": "Línea de Tiempo",
    "nav.copilot": "IA Clínica",
    "nav.meds": "Medicamentos",
    "nav.appointments": "Citas Médicas",
    "nav.analytics": "Analítica de Salud",
    "nav.chronic_care": "Cuidado Crónico",
    "nav.screenings": "Evaluaciones de Salud",
    "nav.profile": "Perfil de Salud",
    "nav.settings": "Configuración",
    "nav.short_records": "Registros",
    "nav.short_copilot": "IA",
    "nav.short_meds": "Medicinas",
    "nav.short_chronic": "Crónico",

    // Common Actions
    "action.save": "Guardar",
    "action.saved": "Configuración guardada exitosamente.",
    "action.cancel": "Cancelar",
    "action.export": "Exportar Historial Completo (JSON)",
    "action.upload": "Subir Documento",
    "action.search": "Buscar registros, medicamentos...",
    "action.view": "Ver",
    "action.edit": "Editar",
    "action.delete": "Eliminar",
    "action.confirm": "Confirmar",
    "action.back": "Volver",
    "action.close": "Cerrar",

    // Settings Page
    "settings.title": "Configuración y Preferencias",
    "settings.subtitle": "Configure la profundidad de explicaciones, modo oscuro, idioma y exportación.",
    "settings.theme_group": "Tema y Apariencia",
    "settings.theme_light": "Modo Claro",
    "settings.theme_dark": "Modo Oscuro",
    "settings.theme_system": "Predeterminado del Sistema",
    "settings.theme_desc": "Elija entre una vista brillante o un modo oscuro cómodo para la vista.",
    "settings.ai_depth_group": "Complejidad de Explicaciones IA",
    "settings.ai_simple_label": "Lenguaje Sencillo / Cotidiano",
    "settings.ai_simple_desc": "Explicaciones claras y conversacionales con analogías cotidianas.",
    "settings.ai_balanced_label": "Equilibrado (Recomendado)",
    "settings.ai_balanced_desc": "Explicaciones claras junto a los biomarcadores clínicos exactos.",
    "settings.ai_detailed_label": "Clínico y Detallado",
    "settings.ai_detailed_desc": "Terminología médica profunda y explicaciones fisiológicas.",
    "settings.lang_group": "Idioma y Estándares Regionales",
    "settings.display_lang": "Idioma de Interfaz",
    "settings.units_format": "Formato de Unidades de Laboratorio",
    "settings.units_val": "Estándar EE.UU. (mg/dL, mmHg)",
    "settings.reminders_group": "Recordatorios y Alertas",
    "settings.notif_meds_label": "Recordatorios de Medicamentos",
    "settings.notif_meds_desc": "Alertas para dosis matutinas (08:00) y nocturnas (20:00).",
    "settings.notif_apts_label": "Recordatorios de Citas",
    "settings.notif_apts_desc": "Alertas 24 horas antes de las consultas programadas.",
    "settings.data_group": "Propiedad de Datos y Portabilidad",
    "settings.data_desc": "Descargue un archivo JSON cifrado con todo su historial de salud personal.",

    // Dashboard & General
    "dashboard.greeting": "Bienvenido",
    "dashboard.active_conditions": "Condiciones Crónicas Activas",
    "dashboard.upcoming_doses": "Dosis de Medicamentos de Hoy",
    "dashboard.recent_records": "Registros Médicos Recientes",
    "dashboard.clinical_alerts": "Información y Alertas Clínicas",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("chronicai_language") as Language | null;
    if (saved && ["en", "bn", "es"].includes(saved)) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem("chronicai_language", newLang);
      document.documentElement.lang = newLang;
    } catch {}
  };

  const t = (key: string, fallback?: string): string => {
    const currentDict = translations[language] || translations.en;
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }
    // Fallback to English dictionary if key not found in selected language
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
