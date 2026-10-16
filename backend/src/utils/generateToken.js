import jwt from "jsonwebtoken";

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      authVersion: Number(user.auth_version ?? 0),
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export default generateToken;
