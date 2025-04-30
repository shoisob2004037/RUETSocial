import express from "express"
import {
  loginUser,
  preRegisterUser,
  verifyEmail,
  resendVerificationCode,
  registerUser,
} from "../Controllers/AuthController.js"

const router = express.Router()
router.post("/pre-register", preRegisterUser)
router.post("/verify-email", verifyEmail)
router.post("/resend-verification", resendVerificationCode)
router.post("/register", registerUser) // Keep for backward compatibility
router.post("/login", loginUser)

export default router
