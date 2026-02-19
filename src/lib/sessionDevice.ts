import { supabase } from "@/lib/supabase"

export type SessionCheckResult =
  | { status: "ok" }
  | { status: "other_device" }

export async function getCurrentSessionDevice(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_sessions")
    .select("current_device_id")
    .eq("user_id", userId)
    .maybeSingle()
  if (error || !data) return null
  return data.current_device_id ?? null
}

export async function claimSession(userId: string, deviceId: string): Promise<void> {
  await supabase
    .from("user_sessions")
    .upsert(
      { user_id: userId, current_device_id: deviceId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
}

export function subscribeSessionDevice(
  userId: string,
  myDeviceId: string,
  onForceLogout: () => void
): () => void {
  const channel = supabase
    .channel(`user_sessions:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "user_sessions",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const newDeviceId = (payload.new as { current_device_id?: string } | null)?.current_device_id
        if (newDeviceId != null && newDeviceId !== myDeviceId) {
          onForceLogout()
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
