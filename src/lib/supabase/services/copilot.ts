import { createClient, isSupabaseConfigured } from "../client";
import { AIConversation, AIMessage } from "@/types/medical";

export async function getConversations(userId: string): Promise<AIConversation[]> {
  if (!userId || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((c: any) => ({
    id: c.id,
    user_id: c.user_id,
    title: c.title,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }));
}

export async function getMessages(conversationId: string): Promise<AIMessage[]> {
  if (!conversationId || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((m: any) => ({
    id: m.id,
    conversation_id: m.conversation_id,
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
    citations: (m.citations as any) || undefined,
    is_emergency_flag: m.is_emergency_flag,
    created_at: m.created_at,
  }));
}

export async function createConversation(
  userId: string,
  title: string
): Promise<AIConversation> {
  const newId = `conv-${Date.now()}`;
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return { id: newId, user_id: userId, title, created_at: now, updated_at: now };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: userId,
      title,
    })
    .select()
    .single();

  if (error || !data) {
    return { id: newId, user_id: userId, title, created_at: now, updated_at: now };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function saveMessage(
  msg: Omit<AIMessage, "id" | "created_at"> & { userId: string }
): Promise<AIMessage> {
  const newId = `msg-${Date.now()}`;
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return {
      id: newId,
      conversation_id: msg.conversation_id,
      role: msg.role,
      content: msg.content,
      citations: msg.citations,
      is_emergency_flag: msg.is_emergency_flag,
      created_at: now,
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_messages")
    .insert({
      conversation_id: msg.conversation_id,
      user_id: msg.userId,
      role: msg.role,
      content: msg.content,
      citations: (msg.citations as any) || null,
      is_emergency_flag: msg.is_emergency_flag || false,
    })
    .select()
    .single();

  if (error || !data) {
    return {
      id: newId,
      conversation_id: msg.conversation_id,
      role: msg.role,
      content: msg.content,
      citations: msg.citations,
      is_emergency_flag: msg.is_emergency_flag,
      created_at: now,
    };
  }

  return {
    id: data.id,
    conversation_id: data.conversation_id,
    role: data.role as any,
    content: data.content,
    citations: (data.citations as any) || undefined,
    is_emergency_flag: data.is_emergency_flag,
    created_at: data.created_at,
  };
}
