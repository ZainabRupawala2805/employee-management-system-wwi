const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true, 
            unique: true,
            default: "Employee",
        },  // e.g., "Founder", "Manager", "Employee"
        permissions: { 
            type: Array, 
            default: [] 
        }  // Can store permissions if needed
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

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
