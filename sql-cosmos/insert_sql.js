const { Connection, Request } = require("tedious");
const sql_config = require('./config/sql_config');

function insert_config(server_name, database_name, username, password) {

    var connection_config = new Connection(sql_config);
    // Create connection to config database
    connection_config.on("connect", err => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('got');
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

module.exports = {
    insert_sql : insert_config
}