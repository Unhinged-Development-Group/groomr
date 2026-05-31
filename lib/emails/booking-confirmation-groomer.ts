interface BookingConfirmationGroomerProps {
  groomerName: string;
  ownerName: string;
  dogName: string;
  serviceName: string;
  scheduledAt: Date;
  appUrl: string;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function bookingConfirmationGroomerEmail(p: BookingConfirmationGroomerProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `New booking: ${p.dogName} on ${formatDate(p.scheduledAt)}`;
  const dateStr = formatDate(p.scheduledAt);
  const timeStr = formatTime(p.scheduledAt);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f8f4;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f8f4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:28px;font-weight:700;color:#2c3e50;letter-spacing:-0.5px;">groomr</span>
        </td></tr>

        <tr><td style="background:#ffffff;border-radius:20px;padding:36px 32px;box-shadow:0 2px 12px rgba(44,62,80,0.07);">

          <div style="text-align:center;margin-bottom:20px;">
            <span style="display:inline-block;background:#c87964;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;text-align:center;">✂️</span>
          </div>

          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#2c3e50;text-align:center;">
            New booking incoming!
          </h1>
          <p style="margin:0 0 28px;font-size:15px;color:#95a5a6;text-align:center;font-weight:600;">
            ${p.ownerName} has booked ${p.dogName} in with you.
          </p>

          <p style="margin:0 0 16px;font-size:15px;color:#2c3e50;">
            Hi ${p.groomerName},
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#2c3e50;line-height:1.6;">
            You've got a new appointment confirmed on Groomr. Here are the details:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f8f4;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <tr><td style="padding:6px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#95a5a6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:100px;">Owner</td>
                  <td style="font-size:14px;color:#2c3e50;font-weight:600;">${p.ownerName}</td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:6px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#95a5a6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:100px;">Dog</td>
                  <td style="font-size:14px;color:#2c3e50;">${p.dogName}</td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:6px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#95a5a6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:100px;">Service</td>
                  <td style="font-size:14px;color:#2c3e50;">${p.serviceName}</td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:6px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#95a5a6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:100px;">Date</td>
                  <td style="font-size:14px;color:#2c3e50;">${dateStr}</td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:6px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#95a5a6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:100px;">Time</td>
                  <td style="font-size:14px;color:#2c3e50;font-weight:700;">${timeStr}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <div style="text-align:center;margin-bottom:24px;">
            <a href="${p.appUrl}/dashboard/groomer" style="display:inline-block;background:#eae45c;color:#2c3e50;font-weight:700;font-size:15px;padding:14px 32px;border-radius:100px;text-decoration:none;">
              View My Bookings
            </a>
          </div>

          <hr style="border:none;border-top:1px solid #f0eeea;margin:24px 0;">

          <p style="margin:0;font-size:13px;color:#95a5a6;text-align:center;">
            Powered by <a href="${p.appUrl}" style="color:#88a096;text-decoration:none;">Groomr</a>
          </p>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${p.groomerName},\n\nYou have a new booking from ${p.ownerName}!\n\nDog: ${p.dogName}\nService: ${p.serviceName}\nDate: ${dateStr}\nTime: ${timeStr}\n\nView your bookings: ${p.appUrl}/dashboard/groomer\n\nPowered by Groomr`;

  return { subject, html, text };
}
