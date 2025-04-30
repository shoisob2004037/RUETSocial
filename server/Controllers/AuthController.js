import UserModel from "../Models/userModel.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { generateVerificationCode, sendVerificationEmail } from "../utils/emailService.js"

// Pre-register user and send verification code
export const preRegisterUser = async (req, res) => {
  try {
    const { email, roll, password, firstname, lastname, department } = req.body

    // Check if email format is valid
    const emailRegex = /^[0-9]+@student\.ruet\.ac\.bd$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format. Email must be in the format: roll@student.ruet.ac.bd",
      })
    }

    // Check if roll matches email prefix
    const emailRoll = email.split("@")[0]
    if (emailRoll !== roll) {
      return res.status(400).json({
        message: "Roll number in email must match the roll field",
      })
    }

    // Check if required fields are provided
    if (!roll || !department) {
      return res.status(400).json({
        message: "Roll number and department are required fields",
      })
    }

    // Check if user already exists
    const oldUser = await UserModel.findOne({ email })
    if (oldUser && oldUser.isVerified) {
      return res.status(400).json({
        message: "User with this email already exists",
      })
    }

    // Check if roll is already used
    const userWithRoll = await UserModel.findOne({ roll, isVerified: true })
    if (userWithRoll) {
      return res.status(400).json({
        message: "User with this roll number already exists",
      })
    }

    // Generate verification code
    const verificationCode = generateVerificationCode()
    const verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPass = await bcrypt.hash(password, salt)

    // If user exists but is not verified, update the user
    if (oldUser && !oldUser.isVerified) {
      oldUser.verificationCode = verificationCode
      oldUser.verificationCodeExpires = verificationCodeExpires
      oldUser.password = hashedPass
      oldUser.firstname = firstname
      oldUser.lastname = lastname
      oldUser.department = department
      oldUser.roll = roll

      await oldUser.save()

      // Send verification email
      const emailSent = await sendVerificationEmail(email, verificationCode)
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" })
      }

      return res.status(200).json({
        message: "Verification code sent to your email",
        userId: oldUser._id,
      })
    }

    // Create new user (unverified)
    const newUser = new UserModel({
      ...req.body,
      password: hashedPass,
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
    })

    // Save the new user
    const user = await newUser.save()

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode)
    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send verification email" })
    }

    res.status(200).json({
      message: "Verification code sent to your email",
      userId: user._id,
    })
  } catch (error) {
    if (error.name === "ValidationError") {
      // Handle mongoose validation errors
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({ message: messages.join(", ") })
    }
    res.status(500).json({ message: error.message })
  }
}

// Verify email with code
export const verifyEmail = async (req, res) => {
  try {
    const { userId, verificationCode } = req.body

    const user = await UserModel.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if verification code is expired
    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ message: "Verification code has expired" })
    }

    // Check if verification code matches
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ message: "Invalid verification code" })
    }

    // Mark user as verified
    user.isVerified = true
    user.verificationCode = null
    user.verificationCodeExpires = null
    await user.save()

    // Generate JWT token
    const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_KEY, { expiresIn: "1h" })

    res.status(200).json({
      message: "Email verified successfully",
      user,
      token,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Resend verification code
export const resendVerificationCode = async (req, res) => {
  try {
    const { userId } = req.body

    const user = await UserModel.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" })
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode()
    const verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    user.verificationCode = verificationCode
    user.verificationCodeExpires = verificationCodeExpires
    await user.save()

    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, verificationCode)
    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send verification email" })
    }

    res.status(200).json({ message: "Verification code resent to your email" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Register new user (keeping this for backward compatibility)
export const registerUser = async (req, res) => {
  try {
    const { email, roll, password, firstname, lastname, department } = req.body

    // Check if email format is valid
    const emailRegex = /^[0-9]+@student\.ruet\.ac\.bd$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format. Email must be in the format: roll@student.ruet.ac.bd",
      })
    }

    // Check if roll matches email prefix
    const emailRoll = email.split("@")[0]
    if (emailRoll !== roll) {
      return res.status(400).json({
        message: "Roll number in email must match the roll field",
      })
    }

    // Check if required fields are provided
    if (!roll || !department) {
      return res.status(400).json({
        message: "Roll number and department are required fields",
      })
    }

    // Check if user already exists
    const oldUser = await UserModel.findOne({ email })
    if (oldUser) {
      return res.status(400).json({
        message: "User with this email already exists",
      })
    }

    // Check if roll is already used
    const userWithRoll = await UserModel.findOne({ roll })
    if (userWithRoll) {
      return res.status(400).json({
        message: "User with this roll number already exists",
      })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPass = await bcrypt.hash(password, salt)

    // Create new user
    const newUser = new UserModel({
      ...req.body,
      password: hashedPass,
      isVerified: false, // Set as unverified by default
    })

    // Save the new user
    const user = await newUser.save()

    // Generate JWT token
    const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_KEY, { expiresIn: "1h" })

    res.status(200).json({ user, token })
  } catch (error) {
    if (error.name === "ValidationError") {
      // Handle mongoose validation errors
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({ message: messages.join(", ") })
    }
    res.status(500).json({ message: error.message })
  }
}

// Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await UserModel.findOne({ email: email })

    if (!user) {
      return res.status(404).json("User not found")
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate new verification code
      const verificationCode = generateVerificationCode()
      const verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      user.verificationCode = verificationCode
      user.verificationCodeExpires = verificationCodeExpires
      await user.save()

      // Send verification email
      await sendVerificationEmail(user.email, verificationCode)

      return res.status(403).json({
        message: "Email not verified. A new verification code has been sent to your email.",
        userId: user._id,
        requiresVerification: true,
      })
    }

    const validity = await bcrypt.compare(password, user.password)

    if (!validity) {
      return res.status(400).json("Wrong password")
    }

    const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_KEY, { expiresIn: "1h" })
    res.status(200).json({ user, token })
  } catch (err) {
    res.status(500).json(err)
  }
}
