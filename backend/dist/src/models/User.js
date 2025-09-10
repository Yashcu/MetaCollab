"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
        type: String,
        select: false,
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatarUrl: { type: String, default: '' },
}, {
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
});
// --- Mongoose Hooks ---
// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcryptjs_1.default.genSalt(12);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
    next();
});
// Cascade cleanup before removing a user
userSchema.pre('findOneAndDelete', { document: false, query: true }, async function (next) {
    // 'this' is the Query object. We get the user's ID from the query conditions.
    const user = await this.model.findOne(this.getFilter());
    if (!user)
        return next();
    const userId = user._id;
    const Project = mongoose_1.default.model('Project');
    const Task = mongoose_1.default.model('Task');
    await Project.deleteMany({ owner: userId });
    await Project.updateMany({ members: userId }, { $pull: { members: userId } });
    await Task.updateMany({ assignee: userId }, { $unset: { assignee: "" } }); // Use $unset to remove
    next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    // 'this.password' is not available because of 'select: false',
    // so we rely on the query having explicitly selected it.
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.User = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=User.js.map