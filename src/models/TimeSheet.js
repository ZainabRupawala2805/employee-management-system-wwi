const { date } = require("joi");
const mongoose = require("mongoose");

const timesheetSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        }, // Task associated with the timesheet

        date: {
            type: Date,
            required: true,
            default: Date.now,
        }, // Date of work entry
        startTime: {
            type: Date,
            required: true,
            default: Date.now
        }, // Start time of work
        endTime: {
            type: Date,
            default: Date.now
        }, // End time of work (optional, in case task is in progress)
        totalHours: {
            type: Number,
            default: 0,
        }, // Total hours worked on the task

        comments: { type: String }, // Any additional comments
        notes: { type: String }, // Detailed notes about work done
        tags: [{ type: String }], // Tags to categorize timesheet entries

        timer: { type: Boolean, default: false }, // Indicates if the task is actively being tracked
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
        },
    }
);

const Timesheet = mongoose.model('Timesheet', timesheetSchema);
module.exports = Timesheet;
