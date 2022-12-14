const productMethod = {};
const Product = require("../models/product.model");
const acc = require("../middlewares/accessControl");
const fs = require("fs");
const path = require("path");

function getProduct(_field) {
    try {
        return Product.findOne(_field);
    } catch (error) {
        return false;
    }
}

productMethod.getProducts = async(req, res) => {
    try {
        const products = await Product.find();
        if (products) {
            return res.status(200).json({
                status: true,
                products,
                message: "Producto encontrado",
            });
        } else {
            return res.status(400).json({
                status: false,
                message: "No se encontraron productos",
            });
        }
    } catch (error) {
        return res.status(400).json({
            status: false,
            message: "No se encontraron productos",
        });
    }
};

productMethod.getProduct = async(req, res) => {
    try {
        const productID = req.params.id;
        if (productID) {
            const product = await getProduct({ _id: productID });
            if (product) {
                return res.status(200).json({
                    status: true,
                    product,
                    message: "Producto encontrado",
                });
            } else {
                return res.status(400).json({
                    status: false,
                    message: "No se encontraron productos",
                });
            }
        } else {
            return res.status(400).json({
                status: false,
                message: "El ID es requerido",
            });
        }
    } catch (error) {
        return res.status(400).json({
            status: false,
            message: "No se encontraron productos",
        });
    }
};

function convertGallery(gallery) {
    if (gallery.length > 0) {
        let galleryObjet = [];
        for (let i = 0; i < gallery.length; i++) {
            galleryObjet.push({
                filename: gallery[i].filename,
                link: "/img/products/" + gallery[i].filename,
            });
        }

        return galleryObjet;
    }

    return [];
}

function deleteGallery(gallery) {
    if (gallery.length > 0) {
        for (let i = 0; i < gallery.length; i++) {
            fs.unlinkSync(gallery[i].path);
        }
    }
}

productMethod.createProduct = async(req, res) => {
    const permission = acc.can(req.user.rol.name).createAny("product").granted;
    if (permission) {
        const verifyPoster = req.files.poster;
        const gallery = req.files.gallery ?
            convertGallery(req.files.gallery) : [];
        if (verifyPoster) {
            const { name, description, price, dicount, stock, sku } = req.body;
            if (name && description && price && dicount && stock && sku) {
                const verifySKU = await getProduct({ sku: sku });
                if (!verifySKU) {
                    try {
                        const product = new Product({
                            name,
                            description,
                            poster: {
                                filename: verifyPoster[0].filename,
                                link: "/img/products/" + verifyPoster[0].filename,
                            },
                            gallery,
                            price,
                            dicount,
                            stock,
                            sku,
                        });
                        await product.save();
                        return res.status(200).json({
                            status: true,
                            message: "El producto fue creado exitosamente.",
                        });
                    } catch (error) {
                        fs.unlinkSync(verifyPoster[0].path);
                        if (req.files.gallery) {
                            deleteGallery(req.files.gallery);
                        }
                        return res.status(400).json({
                            status: false,
                            message: "Ocurri?? un problema, intentalo de nuevo.",
                        });
                    }
                } else {
                    fs.unlinkSync(verifyPoster[0].path);
                    if (req.files.gallery) {
                        deleteGallery(req.files.gallery);
                    }
                    return res.status(400).json({
                        status: false,
                        message: "El SKU no esta disponible.",
                    });
                }
            } else {
                fs.unlinkSync(verifyPoster[0].path);
                if (req.files.gallery) {
                    deleteGallery(req.files.gallery);
                }
                return res.status(400).json({
                    status: false,
                    message: "Rellene todos los campos obligatorios",
                });
            }
        } else {
            if (req.files.gallery) {
                deleteGallery(req.files.gallery);
            }
            return res.status(400).json({
                status: false,
                message: "El poster es requerido",
            });
        }
    } else {
        if (req.files.poster) {
            fs.unlinkSync(req.files.poster[0].path);
        }
        if (req.files.gallery) {
            deleteGallery(req.files.gallery);
        }
        return res.status(400).json({
            status: false,
            message: "No puedes hacer esta acci??n.",
        });
    }
};

productMethod.updateProduct = async(req, res) => {
    const permission = acc.can(req.user.rol.name).updateAny("product").granted;
    if (permission) {
        const {
            productID,
            name,
            description,
            price,
            dicount,
            stock,
            sku,
        } = req.body;
        if (productID) {
            const product = await getProduct({ _id: productID });
            if (product) {
                if (sku && sku !== product.sku) {
                    const verifySKU = await getProduct({ sku: sku });
                    if (verifySKU) {
                        return res.status(400).json({
                            status: false,
                            message: "El SKU no esta disponible.",
                        });
                    }
                }

                const toUpdateProduct = {};
                name ? (toUpdateProduct.name = name) : false;
                description
                    ?
                    (toUpdateProduct.description = description) :
                    false;
                price ? (toUpdateProduct.price = price) : false;
                dicount ? (toUpdateProduct.dicount = dicount) : false;
                stock ? (toUpdateProduct.stock = stock) : false;
                sku ? (toUpdateProduct.sku = sku) : false;

                try {
                    await product.updateOne({
                        $set: toUpdateProduct,
                    });
                    return res.status(200).json({
                        status: true,
                        message: "El producto se actualizado correctmente.",
                    });
                } catch (error) {
                    return res.status(400).json({
                        status: false,
                        message: "Ocurri?? un problema, intentalo de nuevo.",
                    });
                }
            } else {
                return res.status(400).json({
                    status: false,
                    message: "El producto no fue encontrado.",
                });
            }
        } else {
            return res.status(400).json({
                status: false,
                message: "El ID es requerido",
            });
        }
    } else {
        return res.status(400).json({
            status: false,
            message: "No puedes hacer esta acci??n.",
        });
    }
};

productMethod.updateProductPoster = async(req, res) => {
    if (req.file) {
        const permission = acc.can(req.user.rol.name).updateAny("product")
            .granted;
        if (permission) {
            const { productID } = req.body;
            if (productID) {
                const product = await getProduct({ _id: productID });
                if (product) {
                    try {
                        if (
                            fs.existsSync(
                                __dirname +
                                "/../../public" +
                                product.poster.link
                            )
                        ) {
                            fs.unlink(
                                __dirname +
                                "/../../public" +
                                product.poster.link,
                                async(_) => {
                                    await product.updateOne({
                                        $set: {
                                            poster: {
                                                filename: req.file.filename,
                                                link: "/img/products/" +
                                                    req.file.filename,
                                            },
                                        },
                                    });
                                    return res.status(200).json({
                                        status: false,
                                        message: "El producto se actualizo correctamente.",
                                    });
                                }
                            );
                        } else {
                            await product.updateOne({
                                $set: {
                                    poster: {
                                        filename: req.file.filename,
                                        link: "/img/products/" +
                                            req.file.filename,
                                    },
                                },
                            });
                            return res.status(200).json({
                                status: false,
                                message: "El producto se actualizo correctamente.",
                            });
                        }
                    } catch (error) {
                        return res.status(400).json({
                            status: false,
                            message: "Ocurri?? un problema, intentelo de nuevo.",
                        });
                    }
                } else {
                    return res.status(400).json({
                        status: false,
                        message: "El producto no fue encontrado.",
                    });
                }
            } else {
                return res.status(400).json({
                    status: false,
                    message: "El ID es requerido",
                });
            }
        } else {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                status: false,
                message: "No puesdes hacer esta acci??n.",
            });
        }
    } else {
        return res.status(400).json({
            status: false,
            message: "Eposter es requerido.",
        });
    }
};

productMethod.updateProductGallery = async(req, res) => {
    if (req.files) {
        const permission = acc.can(req.user.rol.name).updateAny("product")
            .granted;
        if (permission) {
            const { productID } = req.body;
            if (productID) {
                const product = await getProduct({ _id: productID });
                if (product) {
                    console.log(product.gallery.length + req.files.length > 5);
                    if (product.gallery.length + req.files.length <= 5) {
                        let productGallery = product.gallery;
                        for (let i = 0; i < req.files.length; i++) {
                            productGallery.push({
                                filename: req.files[i].filename,
                                link: "/img/products/" + req.files[i].filename,
                            });
                        }
                        try {
                            await product.updateOne({
                                $set: {
                                    gallery: productGallery,
                                },
                            });
                            return res.status(400).json({
                                status: false,
                                message: "La galer??a se actualiz?? correctamente.",
                            });
                        } catch (error) {
                            deleteGallery(req.files);
                            return res.status(400).json({
                                status: false,
                                message: "Ocurri?? un problema, intentalo de nuevo.",
                            });
                        }
                    } else {
                        deleteGallery(req.files);
                        return res.status(400).json({
                            status: false,
                            message: "La galer??a debe contener 5 fotos.",
                        });
                    }
                } else {
                    return res.status(400).json({
                        status: false,
                        message: "El producto no fue encontrado",
                    });
                }
            } else {
                return res.status(400).json({
                    status: false,
                    message: "El ID es requerido",
                });
            }
        } else {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                status: false,
                message: "No puesdes hacer esta acci??n.",
            });
        }
    } else {
        return res.status(400).json({
            status: false,
            message: "Tienes que subir una foto.",
        });
    }
};

function deleteUploadedGallery(gallery) {
    try {
        if (gallery.length > 0) {
            for (let i = 0; i < gallery.length; i++) {
                fs.unlinkSync(__dirname + "/../../public" + gallery[i].link);
            }
        }
        return true;
    } catch (error) {
        return false;
    }
}

productMethod.deleteProduct = async(req, res) => {
    const permission = acc.can(req.user.rol.name).deleteAny("product").granted;
    if (permission) {
        try {
            const { productID } = req.body;
            if (productID) {
                const product = await getProduct({ _id: productID });
                if (product) {
                    try {
                        fs.unlink(
                            __dirname + "/../../public" + product.poster.link,
                            async() => {
                                const gallery =
                                    product.gallery.length > 0 ?
                                    deleteUploadedGallery(product.gallery) : [];
                                if (gallery) {
                                    await product.remove();
                                    return res.status(200).json({
                                        status: true,
                                        message: "Producto eliminado correctamente.",
                                    });
                                } else {
                                    return res.status(400).json({
                                        status: false,
                                        message: "Ocurri?? un problema, intentalo de nuevo.",
                                    });
                                }
                            }
                        );
                    } catch (error) {
                        return res.status(400).json({
                            status: false,
                            message: "Ocurri?? un problema, intentalo de nuevo.",
                        });
                    }
                } else {
                    return res.status(400).json({
                        status: false,
                        message: "No se encontraron productos",
                    });
                }
            } else {
                return res.status(400).json({
                    status: false,
                    message: "El ID es requerido",
                });
            }
        } catch (error) {
            return res.status(400).json({
                status: false,
                message: "No se encontraron productos",
            });
        }
    } else {
        return res.status(400).json({
            status: false,
            message: "No puesdes hacer esta acci??n.",
        });
    }
};

productMethod.deleteProductGalleryPhoto = async(req, res) => {
    const permission = acc.can(req.user.rol.name).deleteAny("product").granted;
    if (permission) {
        const { productID, photo } = req.body;
        if (productID && photo) {
            const product = await getProduct({ _id: productID });
            if (product) {
                if (
                    fs.existsSync(
                        __dirname + "/../../public/img/products/" + photo
                    )
                ) {
                    fs.unlink(
                        __dirname + "/../../public/img/products/" + photo,
                        async(_) => {
                            const newGallery = product.gallery.filter(
                                (photoProduct) => {
                                    return photoProduct.filename !== photo;
                                }
                            );
                            try {
                                await product.updateOne({
                                    $set: {
                                        gallery: newGallery,
                                    },
                                });
                                const productRefresh = await getProduct({
                                    _id: productID,
                                });
                                return res.status(200).json({
                                    status: true,
                                    productRefresh,
                                    message: "La galer??a se actualiz?? correctamente.",
                                });
                            } catch (error) {
                                return res.status(400).json({
                                    status: false,
                                    message: "Ocurri?? un problema, intentalo de nuevo.",
                                });
                            }
                        }
                    );
                } else {
                    return res.status(400).json({
                        status: false,
                        message: "Ocurri?? un problema, intentalo de nuevo.",
                    });
                }
            } else {
                return res.status(400).json({
                    status: false,
                    message: "The product was not found.",
                });
            }
        } else {
            return res.status(400).json({
                status: false,
                message: "The ID and photo is required",
            });
        }
    } else {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
            status: false,
            message: "No puesdes hacer esta acci??n.",
        });
    }
};

module.exports = productMethod;