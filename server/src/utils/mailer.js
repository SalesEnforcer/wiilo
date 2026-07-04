const https = require('https');
const nodemailer = require('nodemailer');

const sendWelcomeEmail = async ({ name, email, password, role }) => {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const cleanRole = role === 'superadmin' ? 'Administrator' : role === 'dev' ? 'Lead Developer' : 'Client';
  const portalUrl = process.env.CLIENT_URL || 'http://localhost:4200';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1a202c; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 25px;">
        <svg style="height: 48px; width: 48px; display: inline-block;" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="10" fill="#004ac6"/>
          <path d="M6 10 C6 10, 10 22, 13 22 C16 22, 17 14, 19 14 C21 14, 22 22, 25 22 C28 22, 28 10, 28 10" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="25" cy="10" r="2.5" fill="#f59e0b" />
        </svg>
        <h2 style="font-size: 22px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; color: #1a202c;">wiilo</h2>
        <p style="font-size: 14px; color: #64748b; margin-top: 0;">Your workspace credentials are ready</p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">You have been invited to join the <strong>wiilo</strong> workspace as a <strong>${cleanRole}</strong>. Here are your secure credentials to log in:</p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin: 20px 0; font-size: 14px; line-height: 1.7; color: #0f172a;">
        <div style="margin-bottom: 5px;"><strong>Email:</strong> <span style="font-family: monospace; color: #004ac6; font-weight: bold;">${email}</span></div>
        <div><strong>Password:</strong> <span style="font-family: monospace; color: #004ac6; font-weight: bold;">${password}</span></div>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #334155;">For your security, please configure your profile and update your password in your settings panel after logging in.</p>

      <div style="text-align: center; margin-top: 25px; margin-bottom: 10px;">
        <a href="${portalUrl}/login" target="_blank" style="display: inline-block; background-color: #004ac6; color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 74, 198, 0.2); transition: background-color 0.2s;">
          Open Your Workspace
        </a>
      </div>

      <div style="border-t: 1px solid #e2e8f0; margin-top: 25px; padding-top: 15px; text-align: center;">
        <span style="font-size: 11px; color: #718096;">&copy; 2026 wiilo Inc. All rights reserved.</span>
      </div>
    </div>
  `;

  // --- FAST PATH: Send via Brevo HTTPS REST API (Bypasses Render SMTP Blocks!) ---
  if (process.env.BREVO_API_KEY) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        sender: { name: 'wiilo', email: fromEmail },
        to: [{ email, name }],
        subject: 'Welcome to wiilo! Your credentials are ready.',
        htmlContent: htmlContent
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
          res.resume(); // Ensure socket release
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
        reject(err);
      });

      req.write(postData);
      req.end();
    });
  }

  // --- FALLBACK PATH: Nodemailer SMTP (For local testing if API key is not in .env) ---
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
    subject: 'Welcome to wiilo! Your credentials are ready.',
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[MAILER SMTP] Welcome email sent successfully to ${email}. Message ID: ${info.messageId}`);
  return info;
};

module.exports = { sendWelcomeEmail };
