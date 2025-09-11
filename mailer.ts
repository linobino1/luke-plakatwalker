import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: Deno.env.get("SMTP_HOST"),
  port: Deno.env.get("SMTP_PORT")?.length
    ? parseInt(Deno.env.get("SMTP_PORT") ?? "", 10)
    : undefined,
  auth: {
    user: Deno.env.get("SMTP_USER"),
    pass: Deno.env.get("SMTP_PASS"),
  },
});

export const sendMail = async (options: { subject: string; text: string }) => {
  if (Deno.env.get("ENV") !== "production") {
    console.log("Not in production, skipping email send.");
    console.log(options);
    return;
  }

  try {
    await transporter.sendMail({
      ...options,
      to: Deno.env.get("EMAIL_TO")!,
      from: Deno.env.get("EMAIL_FROM")!,
      cc: Deno.env.get("EMAIL_CC") ?? undefined,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
