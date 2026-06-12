import { Button, Section, Text } from "@react-email/components";
import { render, toPlainText } from "@react-email/render";
import React from "react";
import { DetailRow } from "./components/DetailRow";
import { Layout, colors } from "./components/Layout";
import { fmt, fmtTime } from "@/lib/formatters";

interface Props {
  recipientName: string;
  dogName: string;
  salonName: string;
  serviceName: string;
  scheduledAt: Date;
  cancelledByOwner: boolean;
  reason: string | null;
  appUrl: string;
}



export function AppointmentCancelled(p: Props) {
  const dateStr = fmt(p.scheduledAt);
  const timeStr = fmtTime(p.scheduledAt);
  const cancelledBy = p.cancelledByOwner ? "the owner" : "the groomer";

  return (
    <Layout
      preview={`${p.dogName}'s appointment at ${p.salonName} has been cancelled`}
      appUrl={p.appUrl}
    >
      <Text style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700, color: colors.deepSlate, textAlign: "center" }}>
        Appointment cancelled
      </Text>
      <Text style={{ margin: "0 0 28px", fontSize: 15, color: colors.pebbleGrey, textAlign: "center", fontWeight: 600 }}>
        {p.dogName}'s appointment at {p.salonName} has been cancelled.
      </Text>

      <Text style={{ margin: "0 0 16px", fontSize: 15, color: colors.deepSlate }}>
        Hi {p.recipientName},
      </Text>
      <Text style={{ margin: "0 0 20px", fontSize: 15, color: colors.deepSlate, lineHeight: 1.6 }}>
        The following appointment has been cancelled by {cancelledBy}:
      </Text>

      <Section style={{ backgroundColor: colors.alabaster, borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
        <DetailRow label="Salon" value={p.salonName} bold />
        <DetailRow label="Service" value={p.serviceName} />
        <DetailRow label="Dog" value={p.dogName} />
        <DetailRow label="Was due" value={`${dateStr} at ${timeStr}`} />
      </Section>

      {p.reason && (
        <Text style={{ margin: "0 0 20px", fontSize: 15, color: colors.deepSlate, lineHeight: 1.6 }}>
          <strong>Reason given:</strong> {p.reason}
        </Text>
      )}

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Button
          href={`${p.appUrl}/search`}
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
          Find a New Groomer
        </Button>
      </div>
    </Layout>
  );
}

export default function AppointmentCancelledPreview() {
  return (
    <AppointmentCancelled
      recipientName="Sarah"
      dogName="Biscuit"
      salonName="Paws & Claws"
      serviceName="Full Groom"
      scheduledAt={new Date("2026-07-15T10:30:00")}
      cancelledByOwner={false}
      reason="Groomer unavailable due to illness"
      appUrl="https://groomr.uk"
    />
  );
}

export async function renderAppointmentCancelled(p: Props): Promise<{ subject: string; html: string; text: string }> {
  const html = await render(<AppointmentCancelled {...p} />);
  return {
    subject: `Appointment cancelled: ${p.dogName} at ${p.salonName}`,
    html,
    text: toPlainText(html),
  };
}
