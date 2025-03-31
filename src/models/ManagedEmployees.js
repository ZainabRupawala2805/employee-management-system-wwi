const { required } = require('joi');
const mongoose = require ('mongoose');

const managedEmployeesSchema = new mongoose.Schema(
    {
        employeeId: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }]
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

const ManagedEmployees = mongoose.model('ManagedEmployees', managedEmployeesSchema);
module.exports = ManagedEmployees;