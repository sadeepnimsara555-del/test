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

  let smtpHost = 'smtp.gmail.com';
  try {
    // Manually resolve the hostname to an IPv4 address to bypass environment issues
    const lookup = await require('dns').promises.lookup('smtp.gmail.com', { family: 4 });
    smtpHost = lookup.address;
    console.log(`📡 Resolved smtp.gmail.com to IPv4: ${smtpHost}`);
  } catch (dnsErr) {
    console.warn('⚠️ DNS Lookup failed, falling back to hostname:', dnsErr.message);
  }

  console.log(`📡 Attempting to send email to ${options.email} via ${smtpHost}:465`);
  
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      servername: 'smtp.gmail.com', // Required when connecting via IP address
    },
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
