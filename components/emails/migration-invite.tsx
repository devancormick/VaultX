import { Heading, Text, Button } from "react-email";
import { BaseEmail, emailStyles as s } from "./base";

interface MigrationInviteEmailProps {
  email: string;
  setPasswordUrl: string;
  plan: string;
}

export default function MigrationInviteEmail({ email, setPasswordUrl, plan }: MigrationInviteEmailProps) {
  return (
    <BaseEmail preview="Your account has been migrated to VaultX">
      <Heading style={s.h1}>Your account has been migrated</Heading>
      <Text style={s.p}>
        Your account (<strong style={{ color: "#F8FAFC" }}>{email}</strong>) has been migrated to VaultX with your existing {plan} plan.
      </Text>
      <Text style={s.p}>
        Set a password to activate your new account and access all your assets and billing history.
      </Text>
      <Button href={setPasswordUrl} style={s.ctaButton}>
        Set Your Password
      </Button>
      <Text style={{ ...s.p, fontSize: "13px", marginTop: "16px" }}>
        This link expires in 7 days. Your existing access continues until you complete setup.
      </Text>
    </BaseEmail>
  );
}
