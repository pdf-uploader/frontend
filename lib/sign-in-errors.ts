import type { UserStatus } from "@/lib/types";

/** Login must fail when account is not yet approved or has been rejected. */
export class SignInBlockedByAccountStatusError extends Error {
  readonly code = "ACCOUNT_NOT_APPROVED" as const;
  readonly status: UserStatus;

  constructor(status: UserStatus) {
    const message =
      status === "REJECTED"
        ? "Your account has been rejected. Contact an administrator if you believe this is an error."
        : "Your account is not activated yet. Please wait for administrator approval.";
    super(message);
    this.name = "SignInBlockedByAccountStatusError";
    this.status = status;
  }
}
