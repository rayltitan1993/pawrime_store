import { auth } from "../../../auth";
import { prisma } from "../../../src/lib/prisma";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Check if user has a password (not social login only)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  const hasPassword = !!user?.password;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <SettingsForm addresses={addresses} hasPassword={hasPassword} />
    </div>
  );
}