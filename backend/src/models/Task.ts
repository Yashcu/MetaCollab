import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  project: mongoose.Types.ObjectId;
  assignee?: mongoose.Types.ObjectId;
  status: "todo" | "in-progress" | "done";
  order: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    assignee: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      }
    },
    toObject: { virtuals: true }
  }
);

export const Task = mongoose.model<ITask>("Task", taskSchema);
