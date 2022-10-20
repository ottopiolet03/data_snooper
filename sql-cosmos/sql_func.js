
function insert_config(server_name, database_name, username, password) {
    const { Connection, Request } = require("tedious");
    const sql_config = require('./config/sql_config');
    var connection_config = new Connection(sql_config);
    // Create connection to config database
    connection_config.on("connect", err => {
        if (err) {
            console.error(err.message);
        } else {
            //after connection is made, make and send request
            var request = new Request(`INSERT INTO [dbo].[configs] (DatabaseName, ServerUrl, Username, UserPassword)
                                        VALUES ('${database_name}','${server_name}','${username}','${password}');`,
                (err, rowCount) => {
                    if (err) { console.error(err) }
                    else {
                        //after request is made, connect to chosen database
                        connection_config.close();
                        console.log(database_name + ' added');

                    }
                }
            );
            //on request, store needed info
            connection_config.execSql(request);
        }
    });
    connection_config.connect();
}

function remove_config(database_name) {
    const { Connection, Request } = require("tedious");
    const sql_config = require('./config/sql_config');
    var connection_config = new Connection(sql_config);
    // Create connection to config database
    connection_config.on("connect", err => {
        if (err) {
            console.error(err.message);
        } else {
            //after connection is made, make and send request
            var request = new Request(`DELETE FROM [dbo].[configs] WHERE DatabaseName = '${database_name}';`,
                (err, rowCount) => {
                    if (err) { console.error(err) }
                    else {
                        //after request is made, connect to chosen database
                        connection_config.close();
                        console.log(database_name + ' removed');

                    }
                }
            );
            //on request, store needed info
            connection_config.execSql(request);
        }
    });
    connection_config.connect();
}

function get_configs() {

    return new Promise((resolve, reject) => {
        const { Connection, Request } = require("tedious");
        const sql_config = require('./config/sql_config');

        //global variables
        let data = {};
        var connection;    //this is connection to selected database

        var connection_config = new Connection(sql_config);
        // Create connection to config database
        connection_config.on("connect", err => {
            if (err) {
                console.error(err.message);
            } else {
                //after connection is made, make and send request
                var request = new Request(`SELECT * FROM [dbo].[configs]`,
                    (err, rowCount) => {
                        if (err) { console.error(err) }
                        else {
                            //after request is made, connect to chosen database
                            connection_config.close();
                            console.log('got configs');
                            resolve(data);
                        }
                    }
                );
                //on request, store needed info
                request.on('row', columns => {
                    data[columns[0].value] = { database: columns[0].value, server: columns[2].value, username: columns[1].value, password: columns[3].value };
                });
                connection_config.execSql(request);
            }
        });
        connection_config.connect();
    });
}

module.exports = {
    insert_sql: insert_config,
    remove_config: remove_config,
    get_configs: get_configs
}