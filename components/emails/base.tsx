import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from "react-email";
import type { ReactNode } from "react";

const styles = {
  body: { backgroundColor: "#0A0C10", margin: "0", padding: "0", fontFamily: "'DM Sans', Arial, sans-serif" },
  container: { maxWidth: "560px", margin: "0 auto", padding: "40px 24px" },
  logo: { fontSize: "20px", fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.5px", marginBottom: "32px", display: "block" as const },
  logoAccent: { color: "#00D4FF" },
  card: { backgroundColor: "#1A1D24", border: "1px solid #2D3340", borderRadius: "12px", padding: "32px", marginBottom: "24px" },
  h1: { color: "#F8FAFC", fontSize: "24px", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2 },
  p: { color: "#94A3B8", fontSize: "15px", lineHeight: 1.6, margin: "0 0 16px" },
  ctaButton: {
    display: "inline-block" as const,
    backgroundColor: "#00D4FF",
    color: "#0A0C10",
    fontWeight: 700,
    fontSize: "14px",
    padding: "12px 24px",
    borderRadius: "8px",
    textDecoration: "none",
    margin: "8px 0",
  },
  footerText: { color: "#2D3340", fontSize: "12px", margin: "0 0 4px" },
  hr: { borderColor: "#2D3340", margin: "24px 0" },
};

interface BaseEmailProps {
  preview: string;
  children: ReactNode;
}

export function BaseEmail({ preview, children }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <span style={styles.logo}>
            Vault<span style={styles.logoAccent}>X</span>
          </span>
          <Section style={styles.card}>{children}</Section>
          <Hr style={styles.hr} />
          <Text style={styles.footerText}>
            VaultX &mdash; Secure access. Protected assets. Zero compromise.
          </Text>
          <Text style={styles.footerText}>
            <Link href="https://vaultx.app/unsubscribe" style={{ color: "#2D3340" }}>
              Unsubscribe
            </Link>{" "}
            &bull; 123 Market St, San Francisco CA 94105
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export { styles as emailStyles };
