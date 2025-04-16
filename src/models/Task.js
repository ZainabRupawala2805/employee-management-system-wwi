const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        dateAssigned: {
            type: Date,
            required: true,
            default: new Date()
        },
        dateDue: {
            type: Date,
        },
        sectionId: {
            type: String,
            // enum: ["To-Do", "In Progress", "Completed", "Delayed", "On Hold"],
            required: true,
            // default: "To-Do"
        },
        team: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }],
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        priority: {
            type: String,
            enum: ["High", "Medium", "Low", "Urgent"],
            default: "Medium",
            required: true,
        },
        attachments: [{
            fileUrl: {
                type: String,
                default: null
            },
            originalName: {
                type: String,
                default: null
            }
        }],
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
