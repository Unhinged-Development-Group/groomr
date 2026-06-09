import { Button, Link, Text } from "@react-email/components";
import { render, toPlainText } from "@react-email/render";
import React from "react";
import { Layout, colors } from "./components/Layout";

interface Props {
  ownerName: string;
  dogName: string;
  salonName: string;
  salonPhone?: string | null;
  salonAddress?: string | null;
  appUrl?: string;
}

export function GroomComplete({
  ownerName,
  dogName,
  salonName,
  salonPhone,
  salonAddress,
  appUrl = "https://groomr.uk",
}: Props) {
  return (
    <Layout
      preview={`${dogName} is ready for pickup at ${salonName}!`}
      appUrl={appUrl}
      footer={
        <Text style={{ margin: 0, fontSize: 13, color: colors.pebbleGrey, textAlign: "center" }}>
          You're receiving this because you have an appointment at {salonName}.<br />
          Powered by{" "}
          <Link href={appUrl} style={{ color: colors.sageLeaf, textDecoration: "none" }}>
            Groomr
          </Link>
        </Text>
      }
    >
      <Text style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700, color: colors.deepSlate, textAlign: "center" }}>
        {dogName} is ready!
      </Text>
      <Text style={{ margin: "0 0 24px", fontSize: 15, color: colors.pebbleGrey, textAlign: "center", fontWeight: 600 }}>
        Your grooming session at {salonName} is complete.
      </Text>

      <Text style={{ margin: "0 0 12px", fontSize: 15, color: colors.deepSlate }}>
        Hi {ownerName},
      </Text>
      <Text style={{ margin: "0 0 20px", fontSize: 15, color: colors.deepSlate, lineHeight: 1.6 }}>
        Great news — <strong>{dogName}</strong> has been freshly groomed and is ready for pickup at{" "}
        <strong>{salonName}</strong>.
      </Text>

      {salonPhone && (
        <Text style={{ margin: "0 0 8px", fontSize: 15, color: colors.deepSlate }}>
          Call us on <strong>{salonPhone}</strong> if you have any questions.
        </Text>
      )}
      {salonAddress && (
        <Text style={{ margin: "0 0 8px", fontSize: 13, color: colors.pebbleGrey }}>
          {salonAddress}
        </Text>
      )}

      <div style={{ textAlign: "center", marginTop: 24, marginBottom: 8 }}>
        <Text style={{ margin: "0 0 12px", fontSize: 14, color: colors.deepSlate }}>
          Happy with the groom? Leave a tip for your groomer — 100% goes directly to them.
        </Text>
        <Button
          href={`${appUrl}/dashboard/owner`}
          style={{
            background: colors.gold,
            color: colors.deepSlate,
            fontWeight: 700,
            fontSize: 14,
            padding: "12px 28px",
            borderRadius: 100,
            textDecoration: "none",
          }}
        >
          Leave a tip
        </Button>
      </div>
    </Layout>
  );
}

export default function GroomCompletePreview() {
  return (
    <GroomComplete
      ownerName="Sarah"
      dogName="Biscuit"
      salonName="Paws & Claws"
      salonPhone="0141 123 4567"
      salonAddress="42 High Street, Glasgow, G1 1AA"
      appUrl="https://groomr.uk"
    />
  );
}

export async function renderGroomComplete(p: Props): Promise<{ subject: string; html: string; text: string }> {
  const html = await render(<GroomComplete {...p} />);
  return {
    subject: `${p.dogName} is ready for pickup! 🐾`,
    html,
    text: toPlainText(html),
  };
}
