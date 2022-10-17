const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
// create application/json parser
var jsonParser = bodyParser.json()

const Gremlin = require('gremlin');
const config = require('./sql-cosmos/config/cosmos_config');


const sqltest = require('./sql-cosmos/sqltest.js');
//set up functions to recieve data from Cosmos DB
const authenticator = new Gremlin.driver.auth.PlainTextSaslAuthenticator(`/dbs/${config.database}/colls/${config.collection}`, config.primaryKey)

const client = new Gremlin.driver.Client(
    config.endpoint,
    {
        authenticator,
        traversalsource: "g",
        rejectUnauthorized: true,
        mimeType: "application/vnd.gremlin-v2.0+json"
    }
);


let vertices;
client.submit("g.V()", {}).then((vertex_res) => {
    vertices = vertex_res;
    client.submit("g.E()", {}).then((edge_result) => {
        let edges = edge_result;
        let datae = {vertices, edges };
        //console.log(datae);
        const app = express();
        const port = process.env.PORT || 8080;

        app.use(express.static(__dirname + "/wwwroot"));
        // sendFile will go here
        app.use(express.json());

        app.get('/', function (req, res) {
            res.sendFile(path.join(__dirname, '/index.html'));
        });
        app.get('/data', function (req, res) {
            res.send(datae);
        });
        app.post('/sqltest', jsonParser, function (request, result) {
            var data = sqltest.load_data(request.body.name);
            data.then(res => {
                result.send(res);
            });

        });

        app.listen(port);
        console.log('Server started at http://localhost:' + port);
    });
});










