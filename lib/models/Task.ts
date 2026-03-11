import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  project: string;
  assignee?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  order: number;
  dueDate?: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Title cannot be longer than 200 characters"],
    },

    description: {
      type: String,
      default: "",
      maxlength: [2000, "Description cannot be longer than 2000 characters"],
    },

    project: {
      type: String,
      required: [true, "Project ID is required"],
      index: true,
    },

    assignee: {
      type: String,
      index: true,
      sparse: true,
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    order: {
      type: Number,
      default: 0,
    },

    dueDate: {
      type: Date,
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
      },
    },
    toObject: { virtuals: true },
  }
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1, project: 1 });

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema);