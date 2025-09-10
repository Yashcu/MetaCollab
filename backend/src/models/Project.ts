import mongoose, { Schema, Document, Model, Query } from 'mongoose';
import { IUser } from './User';

export interface IProject extends Document {
  name: string;
  description?: string;
  owner: IUser['_id'];
  members: IUser['_id'][];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
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

projectSchema.pre<Query<IProject, IProject>>('findOneAndDelete', { document: false, query: true }, async function (next) {
  const project = await this.model.findOne(this.getFilter());
  if (!project) return next();

  const projectId = project._id;

  const Task = mongoose.model('Task');
  const Invitation = mongoose.model('Invitation');

  await Task.deleteMany({project: projectId});
  await Invitation.deleteMany({project: projectId});

  next();
});

export const Project: Model<IProject> = mongoose.model<IProject>('Project', projectSchema);
