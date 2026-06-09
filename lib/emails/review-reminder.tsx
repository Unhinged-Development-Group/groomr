import { Button, Link, Text } from "@react-email/components";
import { render, toPlainText } from "@react-email/render";
import React from "react";
import { Layout, colors } from "./components/Layout";

interface Props {
  ownerName: string;
  dogName: string;
  salonName: string;
  appointmentId: string;
  appUrl: string;
}

export function ReviewReminder(p: Props) {
  const reviewUrl = `${p.appUrl}/dashboard/owner`;

  return (
    <Layout
      preview={`How was ${p.dogName}'s groom at ${p.salonName}?`}
      appUrl={p.appUrl}
      footer={
        <Text style={{ margin: 0, fontSize: 13, color: colors.pebbleGrey, textAlign: "center" }}>
          You can leave a review from your{" "}
          <Link href={reviewUrl} style={{ color: colors.sageLeaf, textDecoration: "none" }}>
            appointments page
          </Link>
          .<br />
          Powered by{" "}
          <Link href={p.appUrl} style={{ color: colors.sageLeaf, textDecoration: "none" }}>
            Groomr
          </Link>
        </Text>
      }
    >
      <Text style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700, color: colors.deepSlate, textAlign: "center" }}>
        How did it go?
      </Text>
      <Text style={{ margin: "0 0 28px", fontSize: 15, color: colors.pebbleGrey, textAlign: "center", fontWeight: 600 }}>
        {p.dogName}'s groom at {p.salonName} is complete.
      </Text>

      <Text style={{ margin: "0 0 16px", fontSize: 15, color: colors.deepSlate }}>
        Hi {p.ownerName},
      </Text>
      <Text style={{ margin: "0 0 24px", fontSize: 15, color: colors.deepSlate, lineHeight: 1.6 }}>
        We hope <strong>{p.dogName}</strong> is looking fabulous! Your review helps other dog owners find
        great groomers — it only takes 30 seconds.
      </Text>

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Button
          href={reviewUrl}
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
          Leave a Review
        </Button>
      </div>
    </Layout>
  );
}

export default function ReviewReminderPreview() {
  return (
    <ReviewReminder
      ownerName="Sarah"
      dogName="Biscuit"
      salonName="Paws & Claws"
      appointmentId="preview-123"
      appUrl="https://groomr.uk"
    />
  );
}

export async function renderReviewReminder(p: Props): Promise<{ subject: string; html: string; text: string }> {
  const html = await render(<ReviewReminder {...p} />);
  return {
    subject: `How was ${p.dogName}'s groom at ${p.salonName}? ⭐`,
    html,
    text: toPlainText(html),
  };
}
