const nodemailer = require('nodemailer');
const dns = require('dns');

// Force DNS to prefer IPv4 to avoid ENETUNREACH on cloud providers like Railway
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const sendEmail = async (options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email not sent: EMAIL_USER or EMAIL_PASS is missing in environment variables');
    return;
  }

  console.log(`📡 [v5] Attempting email via built-in Gmail service for ${options.email}`);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Verify connection configuration
  try {
    await transporter.verify();
    console.log(' ✅ SMTP Server is ready to take our messages');
  } catch (err) {
    console.error(' ❌ SMTP Verification failed:', err.message);
    throw err;
  }

  const mailOptions = {
    from: `🍽️ Foodie App <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.email}: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Email failed to ${options.email}:`, err.message);
    throw err;
  }
};

module.exports = sendEmail;
