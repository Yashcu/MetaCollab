import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProjectMember {
  userId: string;
  role: "owner" | "admin" | "member";
}

export interface IProject extends Document {
  name: string;
  description?: string;
  owner: string;
  members: IProjectMember[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    members: [
      {
        userId: { type: String, required: true },
        role: {
          type: String,
          enum: ["owner", "admin", "member"],
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: { virtuals: true },
  }
);

// covers "get all projects this user is a member of"
projectSchema.index({ "members.userId": 1, createdAt: -1 });

export const Project: Model<IProject> =
  mongoose.models.Project ?? mongoose.model<IProject>("Project", projectSchema);