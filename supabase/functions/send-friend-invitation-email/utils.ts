import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const FriendInvitationSchema = z.object({
  receiverEmail: z.string().email().max(255),
  senderName: z.string().min(1).max(100).regex(/^[\p{L}\s\-']+$/u),
  invitationToken: z.string().uuid(),
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
