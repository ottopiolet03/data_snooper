const sql_config = {
    authentication: {
        options: {
            userName: "", // update me
            password: "" // update me
        },
        type: "default"
    },
    server: "{your server}.database.windows.net", // update me
    options: {
        database: "", //update me
        encrypt: true
    }
};

module.exports = sql_config;