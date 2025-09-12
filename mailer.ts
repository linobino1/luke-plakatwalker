import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT?.length
    ? parseInt(process.env.SMTP_PORT ?? "", 10)
    : undefined,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendMail = async (options: { subject: string; text: string }) => {
  if (process.env.ENV !== "production") {
    console.log("Not in production, skipping email send.");
    console.log(options);
    return;
  }

  try {
    await transporter.sendMail({
      ...options,
      to: process.env.EMAIL_TO!,
      from: process.env.EMAIL_FROM!,
      cc: process.env.EMAIL_CC ?? undefined,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
