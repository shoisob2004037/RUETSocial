import mongoose from "mongoose"

const UserSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^[0-9]+@student\.ruet\.ac\.bd$/.test(v),
        message: (props) =>
          `${props.value} is not a valid RUET student email! Format should be roll@student.ruet.ac.bd`,
      },
    },
    roll: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^[0-9]+$/.test(v),
        message: (props) => `${props.value} is not a valid roll number!`,
      },
    },
    password: {
      type: String,
      required: true,
    },
    confirmPassword: {
      type: String,
      required: false,
    },
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: null,
    },
    verificationCodeExpires: {
      type: Date,
      default: null,
    },
    profilePicture: String,
    coverPicture: String,
    about: String,
    livesin: String,
    worksAt: String,
    relationship: String,
    university: String,
    department: {
      type: String,
      required: true,
    },
    followers: [],
    following: [],
  },
  { timestamps: true },
)

// Validate that roll matches email
UserSchema.path("email").validate(function () {
  const emailRoll = this.email.split("@")[0]
  return emailRoll === this.roll
}, "Roll number in email must match the roll field")

// Prevent overwriting by checking if the model already exists
const UserModel = mongoose.models.Users || mongoose.model("Users", UserSchema)

export default UserModel
