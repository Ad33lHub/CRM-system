export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, message = 'Error', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
    error: {
      code: 'ERROR',
      statusCode,
    },
  };

  if (errors) {
    response.error.errors = errors;
  }

  return res.status(statusCode).json(response);
};

export const validationError = (res, fields) => {
  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    error: {
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      fields,
    },
  });
};

export const paginatedResponse = (res, data, pagination, ...args) => {
  let page, limit, totalItems, totalPages, hasNextPage, hasPrevPage;
  let finalMessage = 'Success';
  let finalStatusCode = 200;

  if (typeof pagination === 'number') {
    // Called as: paginatedResponse(res, data, page, limit, total, message, statusCode)
    page = pagination;
    limit = args[0]; // limit
    totalItems = args[1]; // total
    totalPages = Math.ceil(totalItems / limit);
    hasNextPage = page < totalPages;
    hasPrevPage = page > 1;
    finalMessage = args[2] || 'Success';
    finalStatusCode = args[3] || 200;
  } else {
    // Called as: paginatedResponse(res, data, paginationObject, message, statusCode)
    page = pagination?.page || 1;
    limit = pagination?.limit || 10;
    totalItems = pagination?.total || 0;
    totalPages = pagination?.totalPages || Math.ceil(totalItems / limit);
    hasNextPage = pagination?.hasNext || false;
    hasPrevPage = pagination?.hasPrev || false;
    finalMessage = args[0] || 'Success';
    finalStatusCode = args[1] || 200;
  }

  return res.status(finalStatusCode).json({
    success: true,
    message: finalMessage,
    data,
    pagination: {
      page,
      limit,
      totalItems: totalItems || 0,
      totalPages: totalPages || 0,
      hasNextPage: !!hasNextPage,
      hasPrevPage: !!hasPrevPage,
    },
  });
};

export const notFound = (res, resource = 'Resource') => {
  return errorResponse(res, `${resource} not found`, 404);
};

export const unauthorised = (res, message = 'Unauthorised') => {
  return errorResponse(res, message, 401);
};

export const forbidden = (res, message = 'Forbidden') => {
  return errorResponse(res, message, 403);
};

export const conflict = (res, message = 'Conflict') => {
  return errorResponse(res, message, 409);
};

export default {
  successResponse,
  errorResponse,
  validationError,
  paginatedResponse,
  notFound,
  unauthorised,
  forbidden,
  conflict,
};
