// ============================================================
// Zoom integration — Server-to-Server OAuth.
// Creates / cancels scheduled Zoom meetings from the backend.
// Env: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_HOST_EMAIL
// ============================================================

const ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const HOST_EMAIL = process.env.ZOOM_HOST_EMAIL;

export function zoomConfigured(): boolean {
  return Boolean(ACCOUNT_ID && CLIENT_ID && CLIENT_SECRET && HOST_EMAIL);
}

// Account-credentials grant → short-lived access token (no per-user login).
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ACCOUNT_ID}`,
    { method: "POST", headers: { Authorization: `Basic ${auth}` }, cache: "no-store" },
  );
  const json = await res.json();
  if (!json.access_token) {
    throw new Error("Zoom auth failed: " + (json.reason || json.error || JSON.stringify(json)));
  }
  return json.access_token as string;
}

export type ZoomMeeting = {
  id: string;
  join_url: string;
  start_url: string;
  password: string;
};

// Create a scheduled meeting hosted by ZOOM_HOST_EMAIL.
export async function createZoomMeeting(opts: {
  topic: string;
  startTime: string; // ISO 8601, e.g. 2026-06-25T15:00:00
  duration: number; // minutes
  agenda?: string;
}): Promise<ZoomMeeting> {
  if (!zoomConfigured()) throw new Error("Zoom is not configured (missing env vars).");
  const token = await getAccessToken();
  const res = await fetch(
    `https://api.zoom.us/v2/users/${encodeURIComponent(HOST_EMAIL!)}/meetings`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: opts.topic,
        type: 2, // scheduled
        start_time: opts.startTime,
        duration: opts.duration,
        timezone: "Asia/Kolkata",
        agenda: opts.agenda || "",
        settings: {
          join_before_host: true,
          waiting_room: false,
          approval_type: 2, // no registration required
          host_video: true,
          participant_video: true,
        },
      }),
      cache: "no-store",
    },
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error("Zoom create failed: " + (json.message || JSON.stringify(json)));
  }
  return {
    id: String(json.id),
    join_url: json.join_url,
    start_url: json.start_url,
    password: json.password || "",
  };
}

export type ZoomListItem = {
  id: string;
  topic: string;
  start_time: string; // ISO with offset (UTC 'Z') from Zoom
  duration: number;
  join_url: string;
  agenda?: string;
};

// List the host's scheduled/upcoming meetings straight from Zoom, so meetings
// created directly in the Zoom app still show up in the admin panel.
export async function listZoomMeetings(
  type: "upcoming" | "scheduled" = "upcoming",
): Promise<ZoomListItem[]> {
  if (!zoomConfigured()) return [];
  const token = await getAccessToken();
  const res = await fetch(
    `https://api.zoom.us/v2/users/${encodeURIComponent(HOST_EMAIL!)}/meetings?type=${type}&page_size=100`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  const json = await res.json();
  if (!res.ok || !Array.isArray(json.meetings)) return [];
  return json.meetings.map((m: any) => ({
    id: String(m.id),
    topic: m.topic || "Zoom Meeting",
    start_time: m.start_time || "",
    duration: Number(m.duration) || 30,
    join_url: m.join_url || "",
    agenda: m.agenda || "",
  }));
}

// Cancel/delete a scheduled meeting (best-effort).
export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  if (!zoomConfigured() || !meetingId) return;
  const token = await getAccessToken();
  await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => {});
}
