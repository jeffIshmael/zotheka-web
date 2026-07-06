import type { User } from "@privy-io/react-auth";

export function getUserEmail(user: User | null | undefined): string | undefined {
  if (!user) return undefined;

  const emailAccount = user.linkedAccounts?.find(
    (account) => account.type === "email"
  );
  if (emailAccount && "address" in emailAccount) {
    return emailAccount.address;
  }

  const googleAccount = user.linkedAccounts?.find(
    (account) => account.type === "google_oauth"
  );
  if (googleAccount && "email" in googleAccount) {
    return googleAccount.email ?? undefined;
  }

  if (user.email?.address) {
    return user.email.address;
  }

  if (user.google?.email) {
    return user.google.email;
  }

  return undefined;
}
