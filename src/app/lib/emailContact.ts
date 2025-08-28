import nodemailer from 'nodemailer';

export async function sendContactEmail(
  toEmail: string,
  userName: string,
  topic: string,
  message: string,
  userEmail: string,
  telephone?: string
) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const emailContent = topic === 'Request New Entry'
    ? `
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
          .content h1 { color: #333333; font-size: 22px; margin-bottom: 20px; }
          .content p { color: #555555; font-size: 15px; line-height: 1.5; margin-bottom: 12px; }
          .highlight { font-weight: bold; color: #0072BC; }
          .footer { background: #f4f4f4; padding: 20px; text-align: center; color: #666666; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://i.ibb.co/8DLfxFz8/GEX-Logo.png" alt="GEX Logo" />
          </div>
          <div class="content">
            <h1>New Contact Message - Request New Entry</h1>
            <p><span class="highlight">From:</span> ${userName} (${userEmail})</p>
            <p><span class="highlight">Telephone:</span> ${telephone || 'Not provided'}</p>
            <p><span class="highlight">Topic:</span> ${topic}</p>
            <p><span class="highlight">Plant Details:</span><br/>${message}</p>
            <p style="margin-top: 32px; color: #666;">This email was generated automatically from the contact form.</p>
          </div>
          <div class="footer">
            <p>© 2025 GEX. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
    : `
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
          .content h1 { color: #333333; font-size: 22px; margin-bottom: 20px; }
          .content p { color: #555555; font-size: 15px; line-height: 1.5; margin-bottom: 12px; }
          .highlight { font-weight: bold; color: #0072BC; }
          .footer { background: #f4f4f4; padding: 20px; text-align: center; color: #666666; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://i.ibb.co/8DLfxFz8/GEX-Logo.png" alt="GEX Logo" />
          </div>
          <div class="content">
            <h1>New Contact Message</h1>
            <p><span class="highlight">From:</span> ${userName} (${userEmail})</p>
            <p><span class="highlight">Topic:</span> ${topic}</p>
            <p><span class="highlight">Message:</span><br/>${message}</p>
            <p style="margin-top: 32px; color: #666;">This email was generated automatically from the contact form.</p>
          </div>
          <div class="footer">
            <p>© 2025 GEX. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: `New Contact Message - ${topic}`,
    text: `Hello Admin,\n\nYou received a new contact message from ${userName} (${userEmail}).\n\n${telephone ? `Telephone: ${telephone}\n` : ''}Topic: ${topic}\nMessage: ${message}\n\nBest regards,\nGEX Contact Form`,
    html: emailContent,
  });
}