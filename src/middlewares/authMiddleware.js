const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const authMiddleware = async(req, res, next) => {
    try {
        const token = req.headers["authorization"];
        if (token) {
            const verify = jwt.verify(token, process.env.PRIVATE_KEY);
            if (verify) {
                req.userID = verify;
                const user = await User.findById(verify);
                if (user) {
                    req.user = user;
                    next();
                } else {
                    return res.status(400).json({
                        status: false,
                        message: "Usuario no encontrado, cerrar sesión",
                    });
                }
            } else {
                return res.status(400).json({
                    status: false,
                    message: "El token es incorrecto.",
                });
            }
        } else {
            return res.status(400).json({
                status: false,
                message: "El token es requerido.",
            });
        }
    } catch (error) {
        return res.status(400).json({
            status: false,
            message: "El token es invalido.",
        });
    }
};

module.exports = authMiddleware;