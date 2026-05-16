import crypto from "crypto";

export const attachRequestContext = (req, res, next) => {
  const requestId =
    req.headers["x-request-id"] || req.headers["x-correlation-id"] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};

