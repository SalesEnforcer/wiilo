require('dotenv').config();
const { sendWelcomeEmail } = require('./src/utils/mailer');

const runMultiTest = async () => {
  const recipients = ["12brandify@gmail.com", "brandecommerce.sales@gmail.com"];
  
  console.log('=== TEST PROTOCOL: SPAM-PROOF MULTI-RECIPIENT INBOX DELIVERY ===');
  console.log(`Sending to: ${recipients.join(', ')}`);
  console.log(`FROM: ${process.env.SMTP_FROM_EMAIL || 'noreply@wiilo.startupunknown.com.ng'}\n`);

  for (const email of recipients) {
    try {
      console.log(`[SENDING] Sending credentials email to ${email}...`);
      const result = await sendWelcomeEmail({
        name: email.split('@')[0], // Extract a clean nickname
        email: email,
        password: "TempPassword123!",
        role: "dev"
      });

      if (result) {
        console.log(`[SUCCESS] Email successfully dispatched to ${email}!`);
      } else {
        console.log(`[FAIL] Mailer returned null for ${email}.`);
      }
    } catch (err) {
      console.error(`[EXCEPTION] Mailer failed for ${email}:`, err.message);
    }
    console.log('--------------------------------------------------');
  }
};

runMultiTest();
