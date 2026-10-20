import { validationResult } from 'express-validator';
import { ApiResponse } from '../utils/apiResponse.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(
      res,
      'Validation failed',
      400,
      errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      }))
    );
  }
  next();
};

export default validate;
