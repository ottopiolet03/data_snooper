const config = {};

config.endpoint = "wss://{YOUR DATABASE}.gremlin.cosmos.azure.com:443/";
config.primaryKey = "{your primary key}";
config.database = "{your database}"
config.collection = "{your graph name}"

module.exports = config;