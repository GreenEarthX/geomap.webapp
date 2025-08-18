import nodemailer from 'nodemailer';

export async function sendConfirmationEmail(email: string, connectedUserName?: string, plantName?: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Submission Received - GreenEarthX',
    text: `Hello ${connectedUserName || 'User'},\n\nYour changes for the plant "${plantName || 'Unknown Plant'}" have been submitted and will be reviewed by our team for verification. You will receive another email once your submission is approved.\n\nThank you!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(to right, #0072BC, #00B140); padding: 15px 20px; text-align: center; }
          .header img { max-width: 120px; height: auto; display: block; margin: 0 auto; }
          .content { padding: 30px; }
          .content h1 { color: #333333; font-size: 24px; margin-bottom: 20px; }
          .content p { color: #666666; font-size: 16px; line-height: 1.5; margin-bottom: 20px; }
          .plant { font-size: 18px; font-weight: bold; color: #0072BC; margin-bottom: 16px; }
          .footer { background: #f4f4f4; padding: 20px; text-align: center; color: #666666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://i.ibb.co/8DLfxFz8/GEX-Logo.png" alt="GEX Logo" />
          </div>
          <div class="content">
            <h1>Submission Received</h1>
            <p>Hello <strong>${connectedUserName || 'User'}</strong>,</p>
            <p class="plant">Plant Modified: ${plantName || 'Unknown Plant'}</p>
            <p>Your changes have been submitted and will be reviewed by our team for verification.<br />You will receive another email once your submission is approved.</p>
            <p style="margin-top: 32px; color: #666;">Thank you!<br />GreenEarthX Team</p>
          </div>
          <div class="footer">
            <p>© 2025 GEX. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
