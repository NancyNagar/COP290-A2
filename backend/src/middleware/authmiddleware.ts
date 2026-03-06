import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

//jwt payload  contains data stored in the JWT token, in this case it contains the user ID, which can be used to identify the authenticated user in protected routes
interface JwtPayload {
  userId: string;
}

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

    const token = req.cookies.token;//middleware readsthat cookie

    if (!token) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    (req as any).userId = decoded.userId;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}