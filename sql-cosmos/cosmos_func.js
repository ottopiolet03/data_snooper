


function remove_database(database, server) {
    const Gremlin = require('gremlin');
    const config2 = require("./config/cosmos_config");
    const authenticator = new Gremlin.driver.auth.PlainTextSaslAuthenticator(`/dbs/${config2.database}/colls/${config2.collection}`, config2.primaryKey)

    const client = new Gremlin.driver.Client(
        config2.endpoint,
        {
            authenticator,
            traversalsource: "g",
            rejectUnauthorized: true,
            mimeType: "application/vnd.gremlin-v2.0+json"
        }
    );
    client.open().then(client.submit(`g.V().has('database', '${database}').drop()`).then(client.close().then(console.log('dropped'))));
}

module.exports = {
    remove_cosmos: remove_database
}
