import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "user" | "admin";
  oauthProvider?: "google" | "github" | null;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    oauthProvider: { type: String, enum: ["google", "github", null], default: null },
    avatarUrl: { type: String, default: ""},
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
      }
    },
    toObject: { virtuals: true }
  }
);

export const User = mongoose.model<IUser>("User", userSchema);
