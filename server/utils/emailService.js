import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

// Create a transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Generate a random 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send verification email
export const sendVerificationEmail = async (email, code) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "RUET Social - Email Verification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3b82f6;">RUET Social</h1>
            <p style="font-size: 18px; color: #4b5563;">Email Verification</p>
          </div>
          <div style="padding: 20px; background-color: #f3f4f6; border-radius: 5px; margin-bottom: 20px;">
            <p>Hello,</p>
            <p>Thank you for registering with RUET Social. To complete your registration, please use the verification code below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; background-color: #ffffff; border-radius: 5px; display: inline-block; border: 1px dashed #3b82f6;">
                ${code}
              </div>
            </div>
            <p>This code will expire in 30 minutes.</p>
            <p>If you did not request this verification, please ignore this email.</p>
          </div>
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>RUET Social - Connect with RUET students and alumni</p>
          </div>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Verification email sent:", info.response)
    return true
  } catch (error) {
    console.error("Error sending verification email:", error)
    return false
  }
}
