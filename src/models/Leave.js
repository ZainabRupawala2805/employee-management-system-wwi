const { required } = require("joi");
const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
        },
        reason: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending"
        },
        leaveType: {
            type: String,
            enum: ["Paid", "Sick", "Unpaid", "Select"],
            default: "Select"
        },
        leaveDetails: {
            type: Object, 
            required: true,
        },
        leaveHistory: {
            type: Object
        },
        attachment: {
            type: String, // This will store the file path or URL
            default: null
        },
        attachmentOriginalName: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                ret.id = ret._id;
                delete ret._id;
            },
        },
        toObject: {
            virtuals: true,
        }
    }
);

const Leave = mongoose.model("Leave", leaveSchema);
module.exports = Leave;
