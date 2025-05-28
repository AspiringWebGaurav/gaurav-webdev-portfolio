// app/api/send-contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { generateVisitorMessage } from "@/lib/templates/visitormessage";
import { generateAutoReply } from "@/lib/templates/autoreply";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    firstname,
    lastname,
    email,
    message,
    recaptchaToken,
    turnstileToken,
  } = body;

  if (
    !firstname ||
    !lastname ||
    !email ||
    !message ||
    !recaptchaToken ||
    !turnstileToken
  ) {
    return NextResponse.json(
      { message: "All fields and tokens are required" },
      { status: 400 }
    );
  }

  const remoteip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  try {
    const [recaptchaRes, turnstileRes] = await Promise.all([
      fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY!,
          response: recaptchaToken,
          remoteip,
        }),
      }).then((r) => r.json()),
      fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY!,
          response: turnstileToken,
          remoteip,
        }),
      }).then((r) => r.json()),
    ]);

    if (!recaptchaRes.success || !turnstileRes.success) {
      return NextResponse.json(
        { message: "Human verification failed" },
        { status: 403 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: "Verification failed", error: error.message },
      { status: 500 }
    );
  }

  try {
    const istTime = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    await sgMail.send({
      to: process.env.SENDGRID_TO_EMAIL!,
      from: process.env.SENDGRID_FROM_EMAIL!,
      replyTo: email,
      subject: `New Message from ${firstname} ${lastname}`,
      html: generateVisitorMessage(
        firstname,
        lastname,
        email,
        message,
        istTime
      ),
    });

    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: `Thanks for reaching out, ${firstname}! Here's more about Gaurav 🚀`,
      html: generateAutoReply(firstname, lastname, email, message),
    });

    return NextResponse.json({ message: "Emails sent successfully" });
  } catch (err: any) {
    console.error("SendGrid error:", err.response?.body || err.message || err);
    return NextResponse.json(
      { message: "Email sending failed", error: err.message },
      { status: 500 }
    );
  }
}
