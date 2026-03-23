const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6 },
    avatar: { type: String, default: '' },
    avatarPublicId: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Social auth
    googleId: { type: String, default: '' },
    facebookId: { type: String, default: '' },
    authProvider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
    // Push notifications
    expoPushTokens: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;

  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(this.password);
  if (isBcryptHash) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  // Backward compatibility: migrate legacy plaintext passwords to bcrypt on successful login.
  if (enteredPassword === this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(enteredPassword, salt);
    await this.save();
    return true;
  }

  return false;
};

module.exports = mongoose.model('User', userSchema);
