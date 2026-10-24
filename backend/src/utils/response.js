export function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendCreated(res, data = null, message = 'Resource created successfully') {
  return sendSuccess(res, data, message, 201);
}

export function sendPaginated(res, items, total, page, limit, message = 'Data retrieved successfully') {
  const totalPages = Math.ceil(total / limit) || 1;
  return res.status(200).json({
    success: true,
    message,
    data: items,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNext: Number(page) < totalPages,
      hasPrev: Number(page) > 1,
    },
  });
}

export function sendError(res, message = 'An error occurred', statusCode = 500, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
}
