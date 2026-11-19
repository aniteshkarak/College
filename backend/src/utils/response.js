export const success = (res, data = {}, message = 'Success', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const error = (res, message = 'An error occurred', status = 500, details = null) => {
  return res.status(status).json({
    success: false,
    message,
    details: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? details : undefined,
    timestamp: new Date().toISOString(),
  });
};

export default { success, error };
