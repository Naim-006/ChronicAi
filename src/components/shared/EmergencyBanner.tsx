import React from "react";
import { AlertTriangle, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmergencyBannerProps {
  onDismiss?: () => void;
  message?: string;
}

export function EmergencyBanner({ onDismiss, message }: EmergencyBannerProps) {
  return (
    <div className="rounded-lg border-2 border-red-600 bg-red-50 p-4 text-red-900 shadow-sm" role="alert">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-red-100 p-2 text-red-600 shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-red-900">
            Medical Emergency Warning
          </h4>
          <p className="mt-1 text-xs text-red-800 leading-relaxed">
            {message ||
              "If you are experiencing severe chest pain, sudden shortness of breath, slurred speech, acute weakness, or heavy uncontrolled bleeding, this platform cannot provide emergency care. Please contact emergency services (e.g., 911 or local emergency) immediately."}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <a href="tel:911" className="inline-block">
              <Button size="sm" className="bg-red-700 hover:bg-red-800 text-white font-semibold flex items-center gap-1.5 h-8">
                <PhoneCall className="h-3.5 w-3.5" />
                Call 911 / Emergency Services
              </Button>
            </a>
            {onDismiss && (
              <Button size="sm" variant="outline" onClick={onDismiss} className="text-xs text-red-800 border-red-300 hover:bg-red-100 h-8">
                I am not in an emergency
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
