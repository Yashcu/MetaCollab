import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "crypto";
import { INVITATION_STATUSES, InvitationStatus } from "@/lib/types";

export interface IInvitation extends Document {
  project: string;
  inviter: string;
  recipient: string;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    project: {
      type: String,
      required: [true, "Project ID is required"],
      index: true,
    },
    inviter: {
      type: String,
      required: [true, "Inviter user ID is required"],
      index: true,
    },
    recipient: {
      type: String,
      required: [true, "Recipient email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString("hex"),
    },
    status: {
      type: String,
      enum: [...INVITATION_STATUSES],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        // never expose token over the wire
        delete ret.token;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.token;
      },
    },
  }
);

invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
invitationSchema.index(
  { project: 1, recipient: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);
invitationSchema.index({ recipient: 1, status: 1 });

export const Invitation: Model<IInvitation> =
  mongoose.models.Invitation ??
  mongoose.model<IInvitation>("Invitation", invitationSchema);