import { prisma } from "@/app/server/prisma";
import { getCurrentAdmin } from "@/app/server/auth";
import AdminPageHeader from "../PageHeader";
import Tabs from "../Tabs";
import AdminUsers from "./AdminUsers";
import PasswordForm from "./PasswordForm";

export default async function AdminSettingsPage() {
  const [admins, me] = await Promise.all([
    prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    getCurrentAdmin(),
  ]);

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Settings" }]}
        title="Settings"
        description="Who can get into the admin panel, and your own credentials."
      />

      <Tabs
        tabs={[
          {
            key: "team",
            label: "Admin users",
            count: admins.length,
            content: (
              <AdminUsers
                currentId={me?.id ?? ""}
                initial={admins.map((a) => ({
                  id: a.id,
                  name: a.name,
                  email: a.email,
                  createdAt: a.createdAt.toISOString(),
                }))}
              />
            ),
          },
          { key: "password", label: "My password", content: <PasswordForm /> },
        ]}
      />
    </div>
  );
}
