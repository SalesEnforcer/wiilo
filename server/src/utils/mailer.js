const nodemailer = require('nodemailer');

const sendWelcomeEmail = async ({ name, email, password, role }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587/25
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const portalUrl = process.env.CLIENT_URL || 'http://localhost:4200';
    const cleanRole = role === 'superadmin' ? 'Administrator' : role === 'dev' ? 'Lead Developer' : 'Client';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1a202c; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 25px;">
          <!-- Inline Styled Beautiful Logo Vector SVG -->
          <svg style="height: 45px; width: 45px; display: inline-block;" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#004ac6"/>
            <path d="M11 14h5l2 12H13l-2-12z" fill="white" opacity="0.5"/>
            <path d="M16 14h5l-3 12h-5l3-12z" fill="white" opacity="0.75"/>
            <path d="M21 14h5l-4 12h-5l4-12z" fill="white"/>
            <path d="M26 14h3l-5 12h-3l5-12z" fill="white" opacity="0.6"/>
            <circle cx="28.5" cy="11.5" r="2" fill="#F59E0B"/>
          </svg>
          <h2 style="font-size: 22px; font-weight: bold; margin-top: 15px; color: #0f172a;">Welcome to wiilo</h2>
          <p style="font-size: 14px; color: #64748b; margin-top: -5px;">Your workspace credentials are ready</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">You have been invited to join the <strong>wiilo</strong> workspace as a <strong>${cleanRole}</strong>. Here are your secure credentials to log in:</p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin: 20px 0; font-size: 14px; line-height: 1.7; color: #0f172a;">
          <div style="margin-bottom: 5px;"><strong>Email:</strong> <span style="font-family: monospace; color: #004ac6; font-weight: bold;">${email}</span></div>
          <div><strong>Password:</strong> <span style="font-family: monospace; color: #004ac6; font-weight: bold;">${password}</span></div>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 25px;">Please click the button below to sign into your portal, complete your profile, and change your password in settings.</p>

        <div style="text-align: center; margin-bottom: 25px;">
          <a href="${portalUrl}/login" target="_blank" style="display: inline-block; background-color: #004ac6; color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 74, 198, 0.2); transition: background-color 0.2s;">
            Sign In to wiilo
          </a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
          <span>This is an automated invite email from your administrator. If you did not expect this, please ignore it safely.</span>
          <br><br>
          <span>&copy; 2026 wiilo Inc.</span>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `wiilo <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to wiilo! Your credentials are ready.',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Welcome credentials email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('[MAILER ERROR] Failed to send welcome credentials email:', err.message);
  }
};

module.exports = { sendWelcomeEmail };
