require('dotenv').config(); // Load the .env variables first!
const { sendWelcomeEmail } = require('./src/utils/mailer');

const runMailerTest = async () => {
  // Configured to send to your verified domain email address
  const testEmail = "eneh.bright@salesenforcer.com.ng"; 
  const testPassword = "SecurePassTemp123!";
  
  console.log('=== TEST PROTOCOL: BREVO API TRANSACTIONAL EMAILER ===');
  console.log(`Sending Welcome Credentials email to: ${testEmail}`);

  try {
    const result = await sendWelcomeEmail({
      name: "Bright Test",
      email: testEmail,
      password: testPassword,
      role: "dev"
    });

    if (result) {
      console.log('[SUCCESS] Welcome email sent successfully! Check your inbox in 1 minute.');
    } else {
      console.log('[FAIL] Mailer returned empty result.');
    }
  } catch (err) {
    console.error('[EXCEPTION] Mailer failed:', err.message);
  }
};

runMailerTest();
