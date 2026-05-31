interface ReviewReminderProps {
  ownerName: string;
  dogName: string;
  salonName: string;
  appointmentId: string;
  appUrl: string;
}

export function reviewReminderEmail(p: ReviewReminderProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `How was ${p.dogName}'s groom at ${p.salonName}? ⭐`;
  const reviewUrl = `${p.appUrl}/dashboard/owner`;

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
            <span style="font-size:36px;">⭐⭐⭐⭐⭐</span>
          </div>

          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#2c3e50;text-align:center;">
            How did it go?
          </h1>
          <p style="margin:0 0 28px;font-size:15px;color:#95a5a6;text-align:center;font-weight:600;">
            ${p.dogName}'s groom at ${p.salonName} is complete.
          </p>

          <p style="margin:0 0 16px;font-size:15px;color:#2c3e50;">
            Hi ${p.ownerName},
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#2c3e50;line-height:1.6;">
            We hope <strong>${p.dogName}</strong> is looking fabulous! Your review helps other dog owners find great groomers — it only takes 30 seconds.
          </p>

          <div style="text-align:center;margin-bottom:24px;">
            <a href="${reviewUrl}" style="display:inline-block;background:#eae45c;color:#2c3e50;font-weight:700;font-size:15px;padding:14px 32px;border-radius:100px;text-decoration:none;">
              Leave a Review
            </a>
          </div>

          <hr style="border:none;border-top:1px solid #f0eeea;margin:24px 0;">

          <p style="margin:0;font-size:13px;color:#95a5a6;text-align:center;">
            You can leave a review from your <a href="${reviewUrl}" style="color:#88a096;text-decoration:none;">appointments page</a>.<br>
            Powered by <a href="${p.appUrl}" style="color:#88a096;text-decoration:none;">Groomr</a>
          </p>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${p.ownerName},\n\nWe hope ${p.dogName} is looking fabulous after their groom at ${p.salonName}!\n\nLeave a review (it takes 30 seconds): ${reviewUrl}\n\nPowered by Groomr`;

  return { subject, html, text };
}
