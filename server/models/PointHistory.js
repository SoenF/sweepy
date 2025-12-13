const mongoose = require('mongoose');

const PointHistorySchema = new mongoose.Schema({
    member_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    chore_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chore',
        required: false // Might be a manual adjustment
    },
    points: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
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

module.exports = mongoose.model('PointHistory', PointHistorySchema);
