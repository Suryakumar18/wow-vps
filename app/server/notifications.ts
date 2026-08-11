import "server-only";
import { prisma } from "./prisma";

/**
 * Writes an admin notification.
 *
 * Deliberately never throws: a notification is a side effect of the real work
 * (an order being placed), and failing to record one must not fail the order.
 */
export async function notify(input: {
  type: string;
  title: string;
  body: string;
  href?: string;
}) {
  try {
    await prisma.notification.create({
      data: { type: input.type, title: input.title, body: input.body, href: input.href ?? null },
    });
  } catch (err) {
    console.error("Couldn't record notification:", err);
  }
}
