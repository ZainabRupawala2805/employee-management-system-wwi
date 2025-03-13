const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        dateAssigned: {
            type: Date,
            required: true
        },
        dateDue: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ["To-Do", "In Progress", "Completed"],
            required: true,
            default: "To-Do"
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        priority: {
            type: String,
            enum: ["High", "Medium", "Low", "Urgent"],
            default: "Medium",
            required: true,
        },
        Comments: {
            type: String,
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

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
