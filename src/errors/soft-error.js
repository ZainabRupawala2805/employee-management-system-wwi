// errors/soft-error.js
const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-api');

class SoftError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.OK; // 200
    this.status = 'fail';             // custom status for soft errors
  }
}

module.exports = SoftError;
