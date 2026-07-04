const https = require('https');
const nodemailer = require('nodemailer');

const sendWelcomeEmail = async ({ name, email, password, role }) => {
  const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@wiilo.startupunknown.com.ng";
  const cleanRole = role === 'superadmin' ? 'Administrator' : role === 'dev' ? 'Lead Developer' : 'Client';
  const portalUrl = process.env.CLIENT_URL || 'https://wiilo.startupunknown.com.ng'; // Align domains if possible

  // 1. Sleek, professional, spam-compliant HTML Copy (No aggressive phishing triggers)
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff; color: #18181b;">
      <div style="margin-bottom: 24px;">
        <svg style="height: 40px; width: 40px;" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="10" fill="#004ac6"/>
          <path d="M6 10 C6 10, 10 22, 13 22 C16 22, 17 14, 19 14 C21 14, 22 22, 25 22 C28 22, 28 10, 28 10" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="25" cy="10" r="2.5" fill="#f59e0b" />
        </svg>
      </div>

      <h2 style="font-size: 20px; font-weight: 700; color: #09090b; margin-top: 0; margin-bottom: 8px; tracking-tight">Set up your Wiilo workspace</h2>
      <p style="font-size: 14px; color: #71717a; margin-top: 0; margin-bottom: 24px;">Hi ${name}, you have been added as a ${cleanRole} to the Wiilo workspace.</p>

      <p style="font-size: 14px; line-height: 1.5; color: #27272a; margin-bottom: 16px;">To access your team board and start collaborating, please complete your profile activation using these details:</p>

      <div style="background-color: #f4f4f5; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; color: #09090b;">
        <div style="margin-bottom: 4px;"><strong>ID:</strong> <span style="font-family: monospace; color: #004ac6;">${email}</span></div>
        <div><strong>Key:</strong> <span style="font-family: monospace; color: #004ac6;">${password}</span></div>
      </div>

      <div style="margin-bottom: 24px;">
        <a href="${portalUrl}/login" target="_blank" style="display: inline-block; background-color: #004ac6; color: #ffffff; text-decoration: none; padding: 10px 24px; font-size: 13px; font-weight: 600; border-radius: 10px; transition: background-color 0.2s;">
          Activate Your Account
        </a>
      </div>

      <p style="font-size: 12px; line-height: 1.5; color: #71717a; margin-top: 24px; border-top: 1px solid #e4e4e7; padding-top: 16px;">
        For account security, we recommend modifying your temporary access key under your profile settings immediately upon first login.
      </p>
    </div>
  `;

  // 2. PLAIN TEXT FALLBACK (Essential for SPAM filters!)
  const textContent = `
    Hi ${name},
    You have been invited to join the Wiilo workspace as a ${cleanRole}.
    
    Activate your account at: ${portalUrl}/login
    ID: ${email}
    Key: ${password}
    
    Please change your temporary access key immediately under settings upon logging in.
  `;

  // --- FAST PATH: Send via Brevo HTTPS REST API (Bypasses Render SMTP Blocks!) ---
  if (process.env.BREVO_API_KEY) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        sender: { name: 'wiilo', email: fromEmail },
        to: [{ email, name }],
        subject: 'Action Required: Set up your Wiilo workspace',
        htmlContent: htmlContent,
        textContent: textContent // Dual-format compliant
      });

      const options = {
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          res.resume();
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log(`[MAILER HTTP] Welcome email sent successfully to ${email}. Response: ${body}`);
            resolve(JSON.parse(body));
          } else {
            console.error(`[MAILER HTTP ERROR] Brevo API rejected send (Status ${res.statusCode}): ${body}`);
            reject(new Error(`Status ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', (err) => {
        console.error('[MAILER HTTP ERROR] Connection to Brevo API failed:', err.message);
        resolve(null); // Resolve to prevent crashing the server
      });

      req.write(postData);
      req.end();
    });
  }

  // --- FALLBACK PATH: Nodemailer SMTP ---
  console.log('[MAILER] Falling back to standard SMTP Nodemailer...');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: `wiilo <${fromEmail}>`,
    to: email,
    subject: 'Action Required: Set up your Wiilo workspace',
    text: textContent,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[MAILER SMTP] Welcome email sent successfully to ${email}. Message ID: ${info.messageId}`);
  return info;
};

module.exports = { sendWelcomeEmail };
