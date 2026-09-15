import jwt from "jsonwebtoken";

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
}

export default generateToken;