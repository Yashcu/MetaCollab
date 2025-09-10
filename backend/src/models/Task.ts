import mongoose, { Schema, Document, Model } from 'mongoose';
import { IProject } from './Project';
import { IUser } from './User';

export interface ITask extends Document {
  title: string;
  description?: string;
  project: IProject['_id'];
  assignee?: IUser['_id'];
  status: 'todo' | 'in-progress' | 'done';
  order: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo',
    },
    order: { type: Number, default: 0 },
    dueDate: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: { virtuals: true },
  }
);

taskSchema.pre<ITask>('save', async function (next) {
  if (this.isModified('assignee') && this.assignee) {
    const Project = mongoose.model<IProject>('Project');
    const project = await Project.findById(this.project);

    if (project && !project.members.includes(this.assignee)) {
      return next(new Error('Assignee must be a member of the project.'));
    }
  }
  next();
});

export const Task: Model<ITask> = mongoose.model<ITask>('Task', taskSchema);
