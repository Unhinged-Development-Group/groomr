import { Link, Section, Text } from "@react-email/components";
import { render, toPlainText } from "@react-email/render";
import React from "react";
import { DetailRow } from "./components/DetailRow";
import { Layout, colors } from "./components/Layout";
import { fmt, fmtTime } from "@/lib/formatters";

interface Props {
  ownerName: string;
  dogName: string;
  salonName: string;
  serviceName: string;
  scheduledAt: Date;
  address: string | null;
  appUrl: string;
}


export function AppointmentReminder(p: Props) {
  const dateStr = fmt(p.scheduledAt);
  const timeStr = fmtTime(p.scheduledAt);

  return (
    <Layout
      preview={`${p.dogName} has a grooming appointment tomorrow at ${p.salonName}`}
      appUrl={p.appUrl}
      footer={
        <Text style={{ margin: 0, fontSize: 13, color: colors.pebbleGrey, textAlign: "center" }}>
          Need to cancel or reschedule? Visit your{" "}
          <Link href={`${p.appUrl}/dashboard/owner`} style={{ color: colors.sageLeaf, textDecoration: "none" }}>
            dashboard
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
        Don't forget — tomorrow!
      </Text>
      <Text style={{ margin: "0 0 28px", fontSize: 15, color: colors.pebbleGrey, textAlign: "center", fontWeight: 600 }}>
        {p.dogName} has a grooming appointment at {p.salonName}.
      </Text>

      <Text style={{ margin: "0 0 16px", fontSize: 15, color: colors.deepSlate }}>
        Hi {p.ownerName},
      </Text>
      <Text style={{ margin: "0 0 24px", fontSize: 15, color: colors.deepSlate, lineHeight: 1.6 }}>
        Just a friendly reminder that <strong>{p.dogName}</strong> is booked in tomorrow. Here are the details:
      </Text>

      <Section style={{ backgroundColor: colors.alabaster, borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
        <DetailRow label="Salon" value={p.salonName} bold />
        {p.address && <DetailRow label="Address" value={p.address} />}
        <DetailRow label="Service" value={p.serviceName} />
        <DetailRow label="Date" value={dateStr} />
        <DetailRow label="Time" value={timeStr} bold />
      </Section>
    </Layout>
  );
}

export async function renderAppointmentReminder(p: Props): Promise<{ subject: string; html: string; text: string }> {
  const html = await render(<AppointmentReminder {...p} />);
  return {
    subject: `Reminder: ${p.dogName}'s appointment is tomorrow ⏰`,
    html,
    text: toPlainText(html),
  };
}

export default function AppointmentReminderPreview() {
  return (
    <AppointmentReminder
      ownerName="Sarah"
      dogName="Biscuit"
      salonName="Paws & Claws"
      serviceName="Full Groom"
      scheduledAt={new Date("2026-07-15T10:30:00")}
      address="42 High Street, Glasgow, G1 1AA"
      appUrl="https://groomr.uk"
    />
  );
}
