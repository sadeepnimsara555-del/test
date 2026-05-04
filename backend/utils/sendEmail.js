const nodemailer = require('nodemailer');
const dns = require('dns');

// Force DNS to prefer IPv4 to avoid ENETUNREACH on cloud providers like Railway
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const sendEmail = async (options) => {
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!emailUser || !emailPass) {
    console.warn('⚠️  Email not sent: EMAIL_USER/SMTP_USER or EMAIL_PASS/SMTP_PASS is missing in environment variables');
    return;
  }

  console.log(' Attempting to send email via:', process.env.EMAIL_SERVICE || 'gmail');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465, // true only for 465
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    family: 4, // Force IPv4
  });

  // Verify connection configuration
  try {
    await transporter.verify();
    console.log(' SMTP Server is ready to take our messages');
  } catch (err) {
    console.error(' SMTP Verification failed:', err.message);
    throw err;
  }

  const mailOptions = {
    from: `🍽️ Foodie App <${emailUser}>`,
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
