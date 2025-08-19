import { NextResponse } from 'next/server';
import { sendConfirmationEmail } from '../../lib/email';

export async function POST(request: Request) {
  const { name, email, topic, message } = await request.json();
  const myEmail = process.env.EMAIL_USER || '';
  try {
    await sendConfirmationEmail(
      myEmail,
      name || email || 'User',
      `Contact Topic: ${topic}\nMessage: ${message}\nUser Email: ${email}`
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email.' }, { status: 500 });
  }
}
