const mongoose = require("mongoose");
const moment = require('moment-timezone');

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
            default: () => moment().tz('Asia/Kolkata').toDate() // IST
        },
        dueDate: {
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
        editedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
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
        comments: [
            {
                name: {
                    type: String,
                    required: true
                },
                message: {
                    type: String,
                    required: true
                },
                time: {
                    type: Date,
                    default: Date.now
                },
                replyTo: {
                    name: {type: String, default: null},
                    message: {type: String, default: null}
                }
            }
        ]
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
