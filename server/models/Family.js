const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const FamilySchema = new mongoose.Schema({
    family_name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    password_hash: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.password_hash; // Never expose password hash
        }
    },
    toObject: { virtuals: true }
});

// Hash password before saving
FamilySchema.pre('save', async function () {
    if (!this.isModified('password_hash')) return;

    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

// Method to compare passwords
FamilySchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password_hash);
};

module.exports = mongoose.model('Family', FamilySchema);
