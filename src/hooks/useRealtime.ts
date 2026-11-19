"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface RealtimeSubscriptionProps {
  table: string;
  schema?: string;
  filter?: string;
  enabled?: boolean;
  onPayload?: (payload: any) => void;
  onInsert?: (newRow: any) => void;
  onUpdate?: (newRow: any, oldRow: any) => void;
  onDelete?: (oldRow: any) => void;
  onChange?: () => void;
}

/**
 * Hook to subscribe to realtime Postgres changes on a single table.
 */
export function useRealtimeTable({
  table,
  schema = "public",
  filter,
  enabled = true,
  onPayload,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: RealtimeSubscriptionProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;
  const onInsertRef = useRef(onInsert);
  onInsertRef.current = onInsert;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const onDeleteRef = useRef(onDelete);
  onDeleteRef.current = onDelete;

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const sanitizedFilter = filter ? filter.replace(/[^a-zA-Z0-9]/g, "_") : "all";
    const channelName = `realtime_${table}_${sanitizedFilter}_${Math.random().toString(36).slice(2, 7)}`;

    const channel = supabase.channel(channelName);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema,
          table,
          ...(filter ? { filter } : {}),
        },
        (payload: any) => {
          if (onPayloadRef.current) onPayloadRef.current(payload);
          if (onChangeRef.current) onChangeRef.current();
          if (payload.eventType === "INSERT" && onInsertRef.current) {
            onInsertRef.current(payload.new);
          } else if (payload.eventType === "UPDATE" && onUpdateRef.current) {
            onUpdateRef.current(payload.new, payload.old);
          } else if (payload.eventType === "DELETE" && onDeleteRef.current) {
            onDeleteRef.current(payload.old);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, filter, enabled]);
}

/**
 * Hook to subscribe to realtime Postgres changes across multiple tables.
 */
export function useRealtimeTables({
  tables,
  schema = "public",
  filter,
  enabled = true,
  onChange,
}: {
  tables: string[];
  schema?: string;
  filter?: string;
  enabled?: boolean;
  onChange: () => void;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled || !tables.length) return;

    const supabase = createClient();
    const channelName = `realtime_multi_${tables.join("_")}_${Math.random().toString(36).slice(2, 7)}`;

    const channel = supabase.channel(channelName);

    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema,
          table,
          ...(filter ? { filter } : {}),
        },
        () => {
          if (onChangeRef.current) onChangeRef.current();
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tables.join(","), schema, filter, enabled]);
}
