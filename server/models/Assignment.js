const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
    family_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Family',
        required: true,
        index: true
    },
    chore_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chore',
        required: true
    },
    member_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    date: {
        type: String, // Sticking to YYYY-MM-DD
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    completed_at: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            // Ensure refs are populated or IDs are returned
        }
    },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
