"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { HealthProfile } from "@/types/medical";
import { getHealthProfile } from "@/lib/supabase/services/profile";
import { DoctorProfile, ClinicStaff } from "@/types/doctor-portal";
import { getDoctorProfile, getClinicStaff } from "@/lib/supabase/services/doctor";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: HealthProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  effectiveUserId: string;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;

  // Doctor Portal additions (Additive)
  roles: string[];
  doctorProfile: DoctorProfile | null;
  clinics: ClinicStaff[];
  isDoctor: boolean;
  isPendingDoctor: boolean;
  isAssistant: boolean;
  refreshDoctorProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [clinics, setClinics] = useState<ClinicStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  // If user is logged in, use their real Supabase auth uuid; otherwise empty string
  const effectiveUserId = user?.id || "";

  const loadUserProfile = async (userId: string) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const p = await getHealthProfile(userId);
      setProfile(p);
    } catch {
      setProfile(null);
    }
  };

  const loadDoctorData = async (userId: string) => {
    if (!userId) {
      setDoctorProfile(null);
      setClinics([]);
      return;
    }
    try {
      const [dp, cl] = await Promise.all([
        getDoctorProfile(userId),
        getClinicStaff(userId),
      ]);
      setDoctorProfile(dp);
      setClinics(cl || []);
    } catch {
      setDoctorProfile(null);
      setClinics([]);
    }
  };

  useEffect(() => {
    if (!isConfigured) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setDoctorProfile(null);
      setClinics([]);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        Promise.all([
          loadUserProfile(currentUser.id),
          loadDoctorData(currentUser.id),
        ]).finally(() => {
          setIsLoading(false);
        });
      } else {
        setProfile(null);
        setDoctorProfile(null);
        setClinics([]);
        setIsLoading(false);
      }
    });

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadUserProfile(currentUser.id);
        loadDoctorData(currentUser.id);
      } else {
        setProfile(null);
        setDoctorProfile(null);
        setClinics([]);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  // Realtime profile listener
  useEffect(() => {
    if (!isConfigured || !user?.id) return;
    const supabase = createClient();
    const profileChannel = supabase
      .channel(`realtime_auth_profile_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "health_profiles",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadUserProfile(user.id);
        }
      )
      .subscribe();

    const doctorChannel = supabase
      .channel(`realtime_doctor_profile_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "doctor_profiles",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadDoctorData(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(doctorChannel);
    };
  }, [isConfigured, user?.id]);

  const signOut = async () => {
    if (isConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setDoctorProfile(null);
    setClinics([]);
    router.push("/login");
    router.refresh();
  };

  const refreshProfile = async () => {
    if (effectiveUserId) {
      await loadUserProfile(effectiveUserId);
    }
  };

  const refreshDoctorProfile = async () => {
    if (effectiveUserId) {
      await loadDoctorData(effectiveUserId);
    }
  };

  // Derive roles
  const isDoctor = useMemo(() => {
    return !!(
      doctorProfile &&
      doctorProfile.verification_status === "verified" &&
      doctorProfile.is_active
    );
  }, [doctorProfile]);

  const isPendingDoctor = useMemo(() => {
    return !!(doctorProfile && doctorProfile.verification_status === "pending");
  }, [doctorProfile]);

  const isAssistant = useMemo(() => {
    return clinics.some(
      (c) => c.is_active && (c.role === "assistant" || c.role === "admin")
    );
  }, [clinics]);

  const roles = useMemo(() => {
    const r = ["patient"];
    if (isDoctor) r.push("doctor");
    if (isAssistant) r.push("assistant");
    return r;
  }, [isDoctor, isAssistant]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured,
        effectiveUserId,
        signOut,
        refreshProfile,

        // Doctor Portal additions
        roles,
        doctorProfile,
        clinics,
        isDoctor,
        isPendingDoctor,
        isAssistant,
        refreshDoctorProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
