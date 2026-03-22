import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt"; // uses ACCESS_SECRET

/*it recieves
 req → incoming request
res → response object
next → move to next step
*/
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const token = req.cookies.accessToken;//middleware readsthat cookie

    if (!token) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }
    const payload = verifyAccessToken(token); // ← was jwt.verify with shared secret
    if (!payload) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}