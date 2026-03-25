import { Heading, Text, Button } from "react-email";
import { BaseEmail, emailStyles as s } from "./base";

interface WelcomeEmailProps {
  name: string;
  verifyUrl: string;
}

export default function WelcomeEmail({ name, verifyUrl }: WelcomeEmailProps) {
  return (
    <BaseEmail preview="Welcome to VaultX — verify your email to get started">
      <Heading style={s.h1}>Welcome to VaultX, {name || "there"}!</Heading>
      <Text style={s.p}>
        You&apos;re one step away from secure, gated 3D experiences with enterprise-level auth and billing.
      </Text>
      <Text style={s.p}>Verify your email to activate your account:</Text>
      <Button href={verifyUrl} style={s.ctaButton}>
        Verify Email Address
      </Button>
      <Text style={{ ...s.p, fontSize: "13px", marginTop: "16px" }}>
        This link expires in 24 hours. If you didn&apos;t create a VaultX account, you can safely ignore this email.
      </Text>
    </BaseEmail>
  );
}
