import { Button, Section, Text } from "@react-email/components";
import { render, toPlainText } from "@react-email/render";
import React from "react";
import { Layout, colors } from "./components/Layout";

interface Props {
  recipientName: string;
  downloadUrl: string;
  expiresAt: Date;
  appUrl: string;
}

export function AccountDeletion(p: Props) {
  const expiryStr = p.expiresAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Layout preview="Your Groomr account has been closed" appUrl={p.appUrl}>
      <Text style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700, color: colors.deepSlate, textAlign: "center" }}>
        Account closed
      </Text>
      <Text style={{ margin: "0 0 28px", fontSize: 15, color: colors.pebbleGrey, textAlign: "center", fontWeight: 600 }}>
        Your Groomr account has been closed.
      </Text>

      <Text style={{ margin: "0 0 16px", fontSize: 15, color: colors.deepSlate }}>
        Hi {p.recipientName},
      </Text>
      <Text style={{ margin: "0 0 20px", fontSize: 15, color: colors.deepSlate, lineHeight: 1.6 }}>
        We've closed your account as requested. Your personal information will be permanently deleted on <strong>{expiryStr}</strong>.
      </Text>

      <Section style={{ backgroundColor: colors.alabaster, borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
        <Text style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: colors.deepSlate }}>
          Download your data
        </Text>
        <Text style={{ margin: "0 0 20px", fontSize: 14, color: colors.deepSlate, lineHeight: 1.6 }}>
          You can download a copy of your account data — including your appointment history — any time before {expiryStr}. After that date, your data will be permanently deleted and this link will no longer work.
        </Text>
        <div style={{ textAlign: "center" }}>
          <Button
            href={p.downloadUrl}
            style={{
              background: colors.gold,
              color: colors.deepSlate,
              fontWeight: 700,
              fontSize: 15,
              padding: "14px 32px",
              borderRadius: 100,
              textDecoration: "none",
            }}
          >
            Download your data
          </Button>
        </div>
      </Section>

      <Text style={{ margin: "0 0 16px", fontSize: 13, color: colors.pebbleGrey, lineHeight: 1.6 }}>
        If you didn't request this, please contact us immediately at{" "}
        <a href="mailto:support@groomr.uk" style={{ color: colors.deepSlate }}>support@groomr.uk</a>.
      </Text>
    </Layout>
  );
}

export default function AccountDeletionPreview() {
  return (
    <AccountDeletion
      recipientName="Sarah"
      downloadUrl="https://groomr.uk/api/export/00000000-0000-0000-0000-000000000000"
      expiresAt={new Date("2026-07-14")}
      appUrl="https://groomr.uk"
    />
  );
}

export async function renderAccountDeletion(p: Props): Promise<{ subject: string; html: string; text: string }> {
  const html = await render(<AccountDeletion {...p} />);
  return {
    subject: "Your Groomr account has been closed",
    html,
    text: toPlainText(html),
  };
}
