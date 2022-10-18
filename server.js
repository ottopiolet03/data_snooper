const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
// create application/json parser
var jsonParser = bodyParser.json()

const sqltest = require('./sql-cosmos/sqltest.js');
const insert_sql = require('./sql-cosmos/insert_sql.js');
const get_configs = require('./sql-cosmos/get_configs.js');
//set up functions to recieve data from Cosmos DB



const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(__dirname + "/wwwroot"));
// sendFile will go here
app.use(express.json());

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});
app.get('/load_configs', function (req, result) {
    var data = get_configs.get_configs();
    data.then(res => {
        result.send(res);
    })
})
app.post('/insert_sql', function (req, res) {
    let body = req.body;
    let server = body.server;
    let database = body.database;
    let username = body.username;
    let password = body.password;
    insert_sql.insert_sql(server, database, username, password);
});

app.post('/sqltest', jsonParser, function (request, result) {
    var data = sqltest.load_data(request.body.name);
    data.then(res => {
        result.send(res);
    });
});

app.listen(port);
console.log('Server started at http://localhost:' + port);
  









