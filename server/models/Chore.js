const mongoose = require('mongoose');

const ChoreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    difficulty: {
        type: Number,
        default: 1
    },
    frequency_value: {
        type: Number,
        required: true
    },
    frequency_type: {
        type: String,
        enum: ['days', 'weeks', 'months'],
        required: true
    },
    auto_assign: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Chore', ChoreSchema);
