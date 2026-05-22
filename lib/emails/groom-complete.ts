interface GroomCompleteEmailProps {
  ownerName: string;
  dogName: string;
  salonName: string;
  salonPhone?: string | null;
  salonAddress?: string | null;
}

export function groomCompleteEmail({
  ownerName,
  dogName,
  salonName,
  salonPhone,
  salonAddress,
}: GroomCompleteEmailProps): { subject: string; html: string; text: string } {
  const subject = `${dogName} is ready for pickup! 🐾`;

  const contactLine = salonPhone
    ? `<p style="margin:0 0 8px;">Call us on <strong>${salonPhone}</strong> if you have any questions.</p>`
    : "";

  const addressLine = salonAddress
    ? `<p style="margin:0 0 8px;color:#95a5a6;font-size:13px;">${salonAddress}</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f8f4;font-family:'Nunito',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f8f4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo / wordmark -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:28px;font-weight:700;color:#2c3e50;letter-spacing:-0.5px;">groomr</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:20px;padding:36px 32px;box-shadow:0 2px 12px rgba(44,62,80,0.07);">

          <!-- Paw icon -->
          <div style="text-align:center;margin-bottom:20px;">
            <span style="display:inline-block;background:#eae45c;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;text-align:center;">🐾</span>
          </div>

          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#2c3e50;text-align:center;">
            ${dogName} is ready!
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#95a5a6;text-align:center;font-weight:600;">
            Your grooming session at ${salonName} is complete.
          </p>

          <p style="margin:0 0 12px;font-size:15px;color:#2c3e50;">
            Hi ${ownerName},
          </p>
          <p style="margin:0 0 20px;font-size:15px;color:#2c3e50;line-height:1.6;">
            Great news — <strong>${dogName}</strong> has been freshly groomed and is ready for pickup at <strong>${salonName}</strong>.
          </p>

          ${contactLine}
          ${addressLine}

          <hr style="border:none;border-top:1px solid #f0eeea;margin:24px 0;">

          <p style="margin:0;font-size:13px;color:#95a5a6;text-align:center;">
            You're receiving this because you have an appointment at ${salonName}.<br>
            Powered by <a href="https://groomr.co" style="color:#88a096;text-decoration:none;">Groomr</a>
          </p>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${ownerName},\n\n${dogName} is ready for pickup at ${salonName}!\n\n${salonPhone ? `Call us on ${salonPhone} if you have any questions.\n\n` : ""}Powered by Groomr — https://groomr.co`;

  return { subject, html, text };
}
