const nodemailer = require('nodemailer');

// Create transporter for Gmail
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'your-email@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
  }
});

// Send notification email
const sendNotificationEmail = async (to, subject, message) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER || 'your-email@gmail.com',
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2193b0;">Deaf and Dumb Communication Portal</h2>
          <div style="background: #f5f7fa; padding: 20px; border-radius: 8px;">
            <h3>${subject}</h3>
            <p>${message}</p>
            <p style="color: #666; font-size: 14px;">
              You received this notification because you have an account with our portal.
            </p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
            © 2024 Deaf and Dumb Communication Portal
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Send welcome email for new users
const sendWelcomeEmail = async (to, username) => {
  const subject = 'Welcome to Deaf and Dumb Communication Portal!';
  const message = `
    <p>Hello ${username},</p>
    <p>Welcome to our Deaf and Dumb Communication Portal! Your account has been successfully created.</p>
    <p>You can now start communicating with other users through our platform.</p>
    <p>Best regards,<br>The Portal Team</p>
  `;
  await sendNotificationEmail(to, subject, message);
};
