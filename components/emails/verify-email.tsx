import { Heading, Text, Button } from "react-email";
import { BaseEmail, emailStyles as s } from "./base";

interface VerifyEmailProps {
  verifyUrl: string;
}

export default function VerifyEmailTemplate({ verifyUrl }: VerifyEmailProps) {
  return (
    <BaseEmail preview="Verify your VaultX email address">
      <Heading style={s.h1}>Verify your email</Heading>
      <Text style={s.p}>
        Click the button below to verify your email address and complete your VaultX account setup.
      </Text>
      <Button href={verifyUrl} style={s.ctaButton}>
        Verify Email Address
      </Button>
      <Text style={{ ...s.p, fontSize: "13px", marginTop: "16px" }}>
        This link expires in 24 hours. If you didn&apos;t request this, ignore this email.
      </Text>
    </BaseEmail>
  );
}
