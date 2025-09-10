import mongoose, { Schema, Document, Model, Query } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatarUrl: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.pre<Query<IUser, IUser>>('findOneAndDelete', { document: false, query: true }, async function (next) {
  // 'this' is the Query object. We get the user's ID from the query conditions.
  const userToDelete = await this.model.findOne(this.getFilter());
  if (!userToDelete) return next();

  const userId = userToDelete._id;

  const Project = mongoose.model('Project');
  const Task = mongoose.model('Task');

  await Project.deleteMany({ owner: userId });
  await Project.updateMany({ members: userId }, { $pull: { members: userId } });
  await Task.updateMany({ assignee: userId }, { $unset: { assignee: 1 } });

  next();
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};


export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
