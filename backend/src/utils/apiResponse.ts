export const successResponse = (res: any, data: any, message = "Success", code = 200) => {
  return res.status(code).json({ success: true, message, data });
};

export const errorResponse = (res: any, message = "Error", code = 500, errors?: any) => {
  return res.status(code).json({ success: false, message, errors });
};
