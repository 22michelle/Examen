const app = require("./app");
require("dotenv").config();
require("./database");

// async function init() {
//     await app.listen(process.env.PORT || 4000);

// }

app.listen(app.get("port"), () => {
    console.log("App running on port: ", process.env.PORT || 4000);
});

// init();

module.exports = app;