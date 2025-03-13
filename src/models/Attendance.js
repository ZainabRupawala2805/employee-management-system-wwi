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
            // required: true,
            // default: Date.now,
        },
        clocksOut: {
            type: Date,
            // required: true,
            // default: Date.now,
        },
        totalHours: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["Present", "Absent", "Leave"],
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
