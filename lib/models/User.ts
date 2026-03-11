import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  clerkUserId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatarUrl?: string;
}

const userSchema = new Schema<IUser>(
  {
    clerkUserId: {
      type: String,
      required: [true, "Clerk user ID is required"],
      unique: true,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot be longer than 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot be longer than 254 characters"],
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Optional profile picture URL (from Clerk or uploaded separately)
    avatarUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,

    toJSON: {
      virtuals: true,
      // Clean up the output: rename _id to id and remove internal fields
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: { virtuals: true },
  }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);