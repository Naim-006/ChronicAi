"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { HealthProfile } from "@/types/medical";
import { getHealthProfile } from "@/lib/supabase/services/profile";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: HealthProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  effectiveUserId: string;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<HealthProfile | null>(null);
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

  useEffect(() => {
    if (!isConfigured) {
      setUser(null);
      setSession(null);
      setProfile(null);
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
        loadUserProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
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
      } else {
        setProfile(null);
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

    return () => {
      supabase.removeChannel(profileChannel);
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
    router.push("/login");
    router.refresh();
  };

  const refreshProfile = async () => {
    if (effectiveUserId) {
      await loadUserProfile(effectiveUserId);
    }
  };

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
