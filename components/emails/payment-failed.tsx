import { Heading, Text, Button } from "react-email";
import { BaseEmail, emailStyles as s } from "./base";

interface PaymentFailedEmailProps {
  name: string;
  billingUrl: string;
  gracePeriodDays?: number;
}

export default function PaymentFailedEmail({ name, billingUrl, gracePeriodDays = 7 }: PaymentFailedEmailProps) {
  return (
    <BaseEmail preview="Action required — update your payment method">
      <Heading style={s.h1}>Payment failed</Heading>
      <Text style={s.p}>Hey {name || "there"}, we weren&apos;t able to process your payment.</Text>
      <Text style={s.p}>
        You have a <strong style={{ color: "#F59E0B" }}>{gracePeriodDays}-day grace period</strong> to update your billing details before access is suspended.
      </Text>
      <Button href={billingUrl} style={s.ctaButton}>
        Update Payment Method
      </Button>
      <Text style={{ ...s.p, fontSize: "13px", marginTop: "16px" }}>
        If you believe this is an error, contact us at support@vaultx.app.
      </Text>
    </BaseEmail>
  );
}
