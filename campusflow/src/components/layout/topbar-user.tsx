import { requireUser } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { UserMenu } from "./user-menu";

export async function TopbarUser({ locale }: { locale: Locale }) {
  const { user } = await requireUser(locale);
  const name = user.profile?.full_name ?? user.email ?? "—";
  return <UserMenu name={name} email={user.email} />;
}
