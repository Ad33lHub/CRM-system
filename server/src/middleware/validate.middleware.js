import { z } from 'zod';
import AppError, { ERROR_CODES } from '../utils/AppError.js';

export const validate = (schema) => {
  return async (req, _res, next) => {
    try {
      const toValidate = {};
      if (schema.body) toValidate.body = req.body;
      if (schema.params) toValidate.params = req.params;
      if (schema.query) toValidate.query = req.query;

      let zodSchema;
      if (
        schema &&
        (typeof schema.parse === 'function' || typeof schema.parseAsync === 'function')
      ) {
        zodSchema = schema;
      } else {
        const shape = {};
        if (schema.body) shape.body = schema.body;
        if (schema.params) shape.params = schema.params;
        if (schema.query) shape.query = schema.query;
        zodSchema = z.object(shape);
      }

      const validated = zodSchema.parseAsync
        ? await zodSchema.parseAsync(toValidate)
        : zodSchema.parse(toValidate);

      // Replace req sections with Zod-parsed (typed + stripped) values
      if (validated.body !== undefined) req.body = validated.body;
      if (validated.params !== undefined) req.params = validated.params;
      if (validated.query !== undefined) req.query = validated.query;

      // If schema was a plain Zod object (not wrapped)
      if (!schema.body && !schema.params && !schema.query && validated !== undefined) {
        req.body = validated;
      }

      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        const errors = err.errors.map((e) => {
          let field = e.path.join('.');
          if (field.startsWith('body.')) field = field.slice(5);
          else if (field.startsWith('params.')) field = field.slice(7);
          else if (field.startsWith('query.')) field = field.slice(6);
          return { field, message: e.message };
        });
        return next(new AppError('Validation failed', 422, ERROR_CODES.VALIDATION_ERROR, errors));
      }
      next(err);
    }
  };
};

export default validate;
