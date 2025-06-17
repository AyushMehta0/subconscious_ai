// augment Express.Request to carry our `user`
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";

declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
    }
  }
}

