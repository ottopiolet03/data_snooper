const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
// create application/json parser
var jsonParser = bodyParser.json()

const sqltest = require('./sql-cosmos/sqltest.js');
const sql_func = require('./sql-cosmos/sql_func.js');
const cosmos_func = require('./sql-cosmos/cosmos_func.js');
//set up functions to recieve data from Cosmos DB



const app = express();
const port = process.env.PORT || 8080;

let database = '';
let server = '';
let configs;

app.use(express.static(__dirname + "/wwwroot"));
// sendFile will go here
app.use(express.json());
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
})
app.post('/load', function (req, res) {
    database = req.body.database;
    server = req.body.server;
    configs = req.body.configs;
    res.sendFile(path.join(__dirname, '/wwwroot/graph.html'));
});
app.post('/database', function (req, res) {
    res.send(JSON.stringify({ database: database, server: server, configs: configs }));
});
app.get('/load_configs', function (req, result) {
    var data = sql_func.get_configs();
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
    sql_func.insert_sql(server, database, username, password);
    res.send(JSON.stringify({ server: server, database: database, username: username, password: password}))
});

app.post('/remove_sql', function (req, res) {
    let body = req.body;
    let database = body.database;
    let server = body.server;
    sql_func.remove_config(database);
    cosmos_func.remove_cosmos(database, server);
    res.send(JSON.stringify({ database: database, server: server }));
});

app.post('/sqltest', jsonParser, function (request, result, next) {
        var data = sqltest.load_data(request.body.name);
        data.then(res => {
                result.send(res);
            }).catch(res => result.send(res));    
});

app.listen(port);
console.log('Server started at http://localhost:' + port);
  









