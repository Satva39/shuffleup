import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import generateToken from "../utils/generateToken.js";

export async function register(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Username, email and password are required.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters.",
            });
        }

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "An account with this email already exists.",
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
            [
                username.trim(),
                email.toLowerCase().trim(),
                passwordHash,
            ]
        );

        const user = result.rows[0];

        const token = generateToken(user);

        res.status(201).json({
            message: "Account created successfully.",
            user,
            token,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to create account.",
        });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
            });
        }

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        const token = generateToken(user);

        res.json({
            message: "Login successful.",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
            token,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to login.",
        });
    }
}

export async function getCurrentUser(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, username, email, created_at
       FROM users
       WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        res.json({
            user: result.rows[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to get user.",
        });
    }
}