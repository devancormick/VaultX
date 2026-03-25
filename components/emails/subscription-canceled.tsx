import { Heading, Text, Button } from "react-email";
import { BaseEmail, emailStyles as s } from "./base";

interface SubscriptionCanceledEmailProps {
  name: string;
  reactivateUrl: string;
}

export default function SubscriptionCanceledEmail({ name, reactivateUrl }: SubscriptionCanceledEmailProps) {
  return (
    <BaseEmail preview="Your VaultX subscription has been canceled">
      <Heading style={s.h1}>Subscription canceled</Heading>
      <Text style={s.p}>Hey {name || "there"}, your VaultX subscription has been canceled.</Text>
      <Text style={s.p}>
        You&apos;ll retain access until the end of your current billing period. Your data is preserved for 30 days after cancellation.
      </Text>
      <Button href={reactivateUrl} style={s.ctaButton}>
        Reactivate Subscription
      </Button>
    </BaseEmail>
  );
}
