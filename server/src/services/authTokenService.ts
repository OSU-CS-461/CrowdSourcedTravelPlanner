import jwt from "jsonwebtoken";
import { User } from "../generated/prisma/client";

// -----------------------------------------------------------------------------
// For simplicity, the auth token is the user's ID. We check if the JWT is
// signed by us. If it is, we allow the user's session and hydrate the user.
// Otherwise, we reject it.
// -----------------------------------------------------------------------------

const privateKey = process.env.JWT_SECRET!;
const alg: jwt.Algorithm = "HS256";

export const sign = (user: User): string => {
  if (!privateKey) throw new Error("Missing JWT_SECRET");
  const token = jwt.sign({ id: user.id }, privateKey, {
    algorithm: alg,
  });
  return token;
};

export const verify = (token: string): { id: string } => {
  if (!privateKey) throw new Error("Missing JWT_SECRET");
  const decoded = jwt.verify(token, privateKey, { algorithms: [alg] });
  return decoded as { id: string };
};
