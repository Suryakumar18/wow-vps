import "server-only";
import { parseSocialVideo } from "@/app/components-home/lib/socialVideo";

/**
 * Turns the admin form's `{ url, title }` list into rows for
 * `product_social_videos`.
 *
 * Platform and embed address are derived here, from the URL, rather than being
 * accepted from the request: the storefront renders `embedUrl` straight into an
 * iframe `src`, so letting a client name it would be handing anyone with admin
 * access — or anyone who found the endpoint — an arbitrary frame on every
 * product page. Deriving it means only the four known hosts can ever appear.
 *
 * Unrecognised links are dropped rather than stored broken; the admin editor
 * already flags them as it types, so nothing silently disappears.
 */
export function socialVideoRows(
  input: { url: string; title?: string }[] | undefined,
): { url: string; platform: string; embedUrl: string; title: string; position: number }[] {
  if (!input?.length) return [];

  const rows: { url: string; platform: string; embedUrl: string; title: string; position: number }[] =
    [];

  for (const item of input) {
    const parsed = parseSocialVideo(item.url ?? "");
    if (!parsed) continue;
    rows.push({
      url: parsed.url,
      platform: parsed.platform,
      embedUrl: parsed.embedUrl,
      title: (item.title ?? "").trim(),
      position: rows.length,
    });
  }

  return rows;
}
