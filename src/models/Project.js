const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        category: {
            type: String,
            required: true
        },
        dateAssigned: {
            type: Date,
            required: true,
            default: new Date()
        },
        dueDate: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ["To-Do", "In Progress", "Completed", "Pending", "Delayed", "On Hold"],
            required: true,
            default: "To-Do"
        },
        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        team: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }],
        progress: {
            type: "Number", 
            default: 0,
            required: false
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

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
