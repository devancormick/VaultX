import { Heading, Text, Button } from "react-email";
import { BaseEmail, emailStyles as s } from "./base";

interface SubscriptionActiveEmailProps {
  name: string;
  plan: string;
  dashboardUrl: string;
}

export default function SubscriptionActiveEmail({ name, plan, dashboardUrl }: SubscriptionActiveEmailProps) {
  return (
    <BaseEmail preview={`Your VaultX ${plan} plan is now active`}>
      <Heading style={s.h1}>You&apos;re on {plan}!</Heading>
      <Text style={s.p}>Hey {name || "there"}, your {plan} subscription is now active.</Text>
      <Text style={s.p}>
        You now have access to your full asset library, the 3D viewer, and all platform features included in your plan.
      </Text>
      <Button href={dashboardUrl} style={s.ctaButton}>
        Go to Dashboard
      </Button>
    </BaseEmail>
  );
}
