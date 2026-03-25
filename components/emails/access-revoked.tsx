import { Heading, Text, Button } from "react-email";
import { BaseEmail, emailStyles as s } from "./base";

interface AccessRevokedEmailProps {
  name: string;
  reason?: string;
  supportUrl: string;
}

export default function AccessRevokedEmail({ name, reason, supportUrl }: AccessRevokedEmailProps) {
  return (
    <BaseEmail preview="Your VaultX access has been suspended">
      <Heading style={s.h1}>Access suspended</Heading>
      <Text style={s.p}>Hey {name || "there"}, your VaultX access has been suspended by an administrator.</Text>
      {reason && (
        <Text style={{ ...s.p, color: "#EF4444" }}>Reason: {reason}</Text>
      )}
      <Text style={s.p}>
        If you believe this is an error, please contact our support team.
      </Text>
      <Button href={supportUrl} style={{ ...s.ctaButton, backgroundColor: "#7C3AED" }}>
        Contact Support
      </Button>
    </BaseEmail>
  );
}
