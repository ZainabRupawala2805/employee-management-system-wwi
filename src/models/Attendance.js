const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        clocksIn: {
            type: Date,
        },
        previousClocksIn: {
            type: Date
        },
        clocksOut: {
            type: Date,
        },
        previousClocksOut: {
            type: Date
        },
        totalHours: {
            type: Number,
            default: 0,
        },
        clockInLocation: {
            type: Object,
            required: false
        },
        clockOutLocation: {
            type: Object,
            required: false
        },
        clockInIP: {
            type: String,
            required: false
        },
        clockOutIP: {
            type: String,
            required: false
        },
        status: {
            type: String,
            enum: ["Present", "Absent", "Leave", "In Approval"],
            default: "Present",
            required: true,
        },
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

const Attendance = mongoose.model("Attendance", attendanceSchema);
module.exports = Attendance;
