import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import * as apiResponse from '../utils/apiResponse.js';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return apiResponse.unauthorised(res, 'Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
    req.user = {
      ...decoded,
      _id: decoded.sub,
    };
    next();
  } catch (err) {
    return apiResponse.unauthorised(
      res,
      err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    );
  }
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
    req.user = {
      ...decoded,
      _id: decoded.sub,
    };
  } catch (err) {
    req.user = null;
  }

  next();
};

export default { verifyToken, optionalAuth };
