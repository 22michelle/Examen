const userMethods = {};
require("dotenv").config();
const User = require("../models/user.model");
const Rol = require("../models/rol.model");
const jwt = require("jsonwebtoken");

async function getUser(param) {
    try {
        return User.findOne(param);
    } catch (error) {
        return false;
    }
}

async function getRol(_id) {
    try {
        return Rol.findById(_id);
    } catch (error) {
        return false;
    }
}

userMethods.login = async(req, res) => {
    const { email, password } = req.body;
    const user = await getUser({ email });
    if (user) {
        const verifyPassword = await user.verifyPassword(password);
        if (!verifyPassword) {
            return res.status(400).json({
                status: false,
                message: "Email o password incorrecto.",
            });
        }

        try {
            const token = jwt.sign(
                user._id.toString(),
                process.env.PRIVATE_KEY
            );

            return res.status(200).json({
                status: true,
                token,
                message: "Bienvenido.",
            });
        } catch (error) {
            return res.status(400).json({
                status: false,
                message: "Ocurrión un problema, intentalo de nuevo.",
            });
        }
    } else {
        return res.status(400).json({
            status: false,
            message: "Email o password incorrecto.",
        });
    }
};

userMethods.register = async(req, res) => {
    const { rolID, username, email, password, name } = req.body;
    if (rolID && username && email && password) {
        try {
            const rol = await getRol(rolID);
            if (rol) {
                const verifyUsername = await getUser({ username });
                if (verifyUsername) {
                    return res.status(400).json({
                        status: false,
                        message: "El nombre de usuario ya esta en uso.",
                    });
                }
                const verifyEmail = await getUser({ email });
                if (verifyEmail) {
                    return res.status(400).json({
                        status: false,
                        message: "El email ya esta en uso.",
                    });
                }

                const user = new User({
                    rol: {
                        rolID: rol._id,
                        name: rol.name,
                    },
                    username,
                    email,
                    password,
                    name,
                });
                user.password = await user.encryptPassword(user.password);

                if (await user.save()) {
                    return res.status(200).json({
                        status: true,
                        message: "Usuario creado correctamente.",
                    });
                } else {
                    return res.status(400).json({
                        status: false,
                        message: "Ocurrió un problema, vuelve a intentarlo.",
                    });
                }
            } else {
                return res.status(400).json({
                    status: false,
                    message: "El rol no existe.",
                });
            }
        } catch (error) {
            return res.status(400).json({
                status: false,
                message: "Ocurrió un problema, vuelve a intentarlo.",
            });
        }
    } else {
        return res.status(400).json({
            status: false,
            message: "Rellena todos los campos requeridos.",
        });
    }
};

userMethods.authenticate = (req, res) => {
    try {
        const token = req.headers["authorization"];
        if (token) {
            const verify = jwt.verify(token, process.env.PRIVATE_KEY);
            if (verify) {
                return res.status(200).json({
                    status: true,
                    message: "El token es correcto.",
                });
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

module.exports = userMethods;