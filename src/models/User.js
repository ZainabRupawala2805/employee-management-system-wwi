const mongoose = require("mongoose");
const validator = require('validator');
const { isLowercase } = require("validator");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide username."],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Please provide email id."],
            unique: true,
            isLowercase: true,
            trim: true,
            validate: {
                // validator: validator.isEmail,
                // message: "Please enter a valid email id."
                validator: function (v) {
                    // Regex for validating mobile numbers with +91 or 0 as the prefix
                    return /^[a-zA-Z0-9]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
                },
                message: "Please enter a valid email id."
            }
        },
        contact: {
            // type: String,
            // required: [true, "Please provide mobile number."],
            // match: /^([0|\+[0-9]{1,5})?([7-9][0-9]{9})$/

            type: String,
            required: true,
            validate: {
                validator: function (v) {
                    // Regex for validating mobile numbers with +91 or 0 as the prefix
                    return /^([0|\+[0-9]{1,5})?([7-9][0-9]{9})$/.test(v);
                },
                message: props => `${props.value} is not a valid mobile number!`
            }
        },
        password: {
            type: String,
            required: [true, "Please provide password."],
            // match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{6,}$/
        },
        dateOfJoining: {
            type: Date,
            required: [true, "Please provide Date of Joining."],
            // match: /\d{2}-\d{2}-\d{4}/
        },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            required: [true, "Please provide role."],
        }, // Links to Role schema
        reportBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }], // Manager ID | Updating it to array for multiple users entry
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active"
        },
        availableLeaves: {
            type: Number,
            default: function () {
                // Calculate availableLeaves as the sum of sickLeave and paidLeave
                return this.sickLeave + this.paidLeave;
            },
        },
        sickLeave: {
            type: Number,
            required: true,
        },
        paidLeave: {
            type: Number,
            required: true,
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

const User = mongoose.model("User", userSchema);
module.exports = User;
