import { Heading, Text, Button } from "react-email";
import { BaseEmail, emailStyles as s } from "./base";

interface PasswordResetEmailProps {
  resetUrl: string;
}

export default function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  return (
    <BaseEmail preview="Reset your VaultX password">
      <Heading style={s.h1}>Reset your password</Heading>
      <Text style={s.p}>
        We received a request to reset your password. Click the button below to set a new one.
      </Text>
      <Button href={resetUrl} style={s.ctaButton}>
        Reset Password
      </Button>
      <Text style={{ ...s.p, fontSize: "13px", marginTop: "16px" }}>
        This link expires in 15 minutes. If you didn&apos;t request a password reset, you can safely ignore this email.
      </Text>
    </BaseEmail>
  );
}
