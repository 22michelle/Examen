const rolMethod = {};
const Rol = require("../models/rol.model");
const acc = require("../middlewares/accessControl");

async function getRol(_id) {
    try {
        return Rol.findById(_id);
    } catch (error) {
        return false;
    }
}

rolMethod.getRols = async(req, res) => {
    const permission = acc.can(req.user.rol.name).readAny("rol").granted;
    if (permission) {
        try {
            const rols = await Rol.find();
            if (rols) {
                return res.status(200).json({
                    status: true,
                    rols,
                    message: "Roles encontrados.",
                });
            } else {
                return res.status(400).json({
                    status: false,
                    message: "No se encontraron roles.",
                });
            }
        } catch (error) {
            return res.status(400).json({
                status: false,
                message: "No se encontraron roles.",
            });
        }
    } else {
        return res.status(400).json({
            status: false,
            message: "No puedes hacer esta acción.",
        });
    }
};

rolMethod.getRol = async(req, res) => {
    const permission = acc.can(req.user.rol.name).readAny("rol").granted;
    if (permission) {
        try {
            const rolID = req.params.id;
            if (rolID) {
                const rol = await getRol(rolID);
                if (rol) {
                    return res.status(200).json({
                        status: true,
                        rol,
                        message: "Rol encontrado.",
                    });
                } else {
                    return res.status(400).json({
                        status: false,
                        message: "Rol no encontrado.",
                    });
                }
            } else {
                return res.status(400).json({
                    status: false,
                    message: "El ID es requerido.",
                });
            }
        } catch (error) {
            return res.status(400).json({
                status: false,
                message: "No se encontraron roles.",
            });
        }
    } else {
        return res.status(400).json({
            status: false,
            message: "No puedes hacer esta acción.",
        });
    }
};

rolMethod.createRol = async(req, res) => {
    const permission = acc.can(req.user.rol.name).createAny("rol").granted;
    if (permission) {
        const { name } = req.body;
        if (name) {
            const verify = Object.values(rols).some((rol) => {
                return rol === name;
            });

            if (verify) {
                const rol = new Rol({
                    name,
                });
                if (await rol.save()) {
                    return res.status(201).json({
                        status: true,
                        message: "Rol creado correctamente.",
                    });
                } else {
                    return res.status(400).json({
                        status: false,
                        message: "Ocurrió un problema, intentalo de nuevo.",
                    });
                }
            } else {
                return res.status(400).json({
                    status: false,
                    message: "El nombre no es valido.",
                });
            }
        } else {
            return res.status(400).json({
                status: false,
                message: "Rellene todo los campos requeridos.",
            });
        }
    } else {
        return res.status(400).json({
            status: false,
            message: "No puedes hacer esta acción.",
        });
    }
};

rolMethod.updateRol = async(req, res) => {
    const permission = acc.can(req.user.rol.name).updateAny("rol").granted;
    if (permission) {
        const { rolID, name } = req.body;
        if (rolID && name) {
            try {
                const rol = await getRol(rolID);
                if (rol) {
                    const verify = Object.values(rols).some((rol) => {
                        return rol === name;
                    });
                    if (!verify) {
                        return res.status(400).json({
                            status: false,
                            message: "El nombre no es valido",
                        });
                    }

                    if (
                        await rol.updateOne({
                            name,
                        })
                    ) {
                        return res.status(200).json({
                            status: true,
                            message: "El rol fue creado correctamente.",
                        });
                    } else {
                        return res.status(400).json({
                            status: false,
                            message: "Ocurrió un problema, intentalo de nuevo.",
                        });
                    }
                } else {
                    return res.status(400).json({
                        status: false,
                        message: "El rolID, no se encontro.",
                    });
                }
            } catch (error) {
                return res.status(400).json({
                    status: false,
                    message: "Ocurrió un problema, intentalo de nuevo.",
                });
            }
        } else {
            return res.status(400).json({
                status: false,
                message: "Rellena todos los campos requeridos.",
            });
        }
    } else {
        return res.status(400).json({
            status: false,
            message: "No puedes hacer esta acción.",
        });
    }
};

rolMethod.deleteRol = async(req, res) => {
    const permission = acc.can(req.user.rol.name).deleteAny("rol").granted;
    if (permission) {
        const { rolID } = req.body;
        if (rolID) {
            try {
                const rol = await getRol(rolID);
                if (rol) {
                    if (await rol.deleteOne()) {
                        return res.status(200).json({
                            status: true,
                            message: "El rol fue eliminado correctamente",
                        });
                    } else {
                        return res.status(400).json({
                            status: false,
                            message: "Ocurrió un problema, intentalo de nuevo.",
                        });
                    }
                } else {
                    return res.status(400).json({
                        status: false,
                        message: "The rolID, was not found.",
                    });
                }
            } catch (error) {
                return res.status(400).json({
                    status: false,
                    message: "Ocurrió un problema, intentalo de nuevo.",
                });
            }
        } else {
            return res.status(400).json({
                status: false,
                message: "El ID es requerido.",
            });
        }
    } else {
        return res.status(400).json({
            status: false,
            message: "No puedes hacer esta acción.",
        });
    }
};

module.exports = rolMethod;