import mongoose, { Schema, Document, Model } from 'mongoose';
import { IProject } from './Project';
import { IUser } from './User';

export interface IInvitation extends Document {
  project: IProject['_id'];
  inviter: IUser['_id'];
  recipient: IUser['_id'];
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  inviter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}, {
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
});

invitationSchema.index(
  { project: 1, recipient: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

export const Invitation: Model<IInvitation> = mongoose.model<IInvitation>('Invitation', invitationSchema);
