import nodemailer from "nodemailer";

export const sendContactMessage = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form Message from ${name} through JanSeva Portal`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="text-align: center; color: #333; margin-bottom: 20px;">📩 New Contact Form Message</h2>
          <p style="font-size: 16px; color: #555;"><strong>Name:</strong> ${name}</p>
          <p style="font-size: 16px; color: #555;"><strong>Email:</strong> ${email}</p>
          <p style="font-size: 16px; color: #555;"><strong>Message:</strong></p>
          <div style="background-color: #fff; border-left: 4px solid #4CAF50; padding: 10px 15px; margin-top: 8px; font-size: 15px; color: #444;">
            ${message}
          </div>
          <p style="font-size: 14px; color: #999; margin-top: 20px; text-align: center;">This message was sent from the JanSeva Portal contact form.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending email. Try again later.",
    });
  }
};
