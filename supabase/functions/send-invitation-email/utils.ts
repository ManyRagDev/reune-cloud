import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const InvitationSchema = z.object({
  invitee_email: z.string().email().max(255),
  invitee_name: z.string().min(1).max(100).regex(/^[\p{L}\s\-']+$/u),
  event_title: z.string().min(1).max(200),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_time: z.string().regex(/^\d{2}:\d{2}$/),
  event_location: z.string().max(500).optional(),
  is_organizer: z.boolean(),
  invitation_token: z.string().uuid(),
});

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
