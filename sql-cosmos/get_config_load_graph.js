
function sqltest(database) {
    return new Promise((resolve, reject) => {
        const { Connection, Request } = require("tedious");
        const sql_config = require('./config/sql_config');
        let data;

        //global variables
        var server_name;
        var database_name;
        var username;
        var password;
        var connection;    //this is connection to selected database

        var selected_database = database;
        var connection_config;
        // Create connection to config database
        function create_config() {
            try {
                connection_config = new Connection(sql_config);
            } catch (error) {
                reject(error);
            }
            connection_config.on("connect", err => {
                if (err) {
                    reject(err);
                } else {
                    //after connection is made, make and send request
                    var request = new Request(`SELECT * FROM [dbo].[configs] WHERE DatabaseName = '${selected_database}'`,
                        (err, rowCount) => {
                            if (err) { reject(err) }
                            else {
                                //after request is made, connect to chosen database
                                connection_config.close();
                                console.log(server_name);

                                //set up config to database that was chosen
                                const config = {
                                    authentication: {
                                        options: {
                                            userName: username,
                                            password: password
                                        },
                                        type: "default"
                                    },
                                    server: server_name,
                                    options: {
                                        database: database_name,
                                        encrypt: true
                                    }
                                };
                                connection = new Connection(config);
                               
                                connection.on("connect", err => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        //after connection made, run queries
                                        queryDatabase();

                                    }
                                });
                                connection.connect();
                            }
                        }
                    );
                    //on request, store needed info
                    request.on('row', columns => {
                        database_name = columns[0].value;
                        server_name = columns[1].value;
                        username = columns[2].value;
                        password = columns[3].value;
                    });

                    connection_config.execSql(request);
                }
            });
        }


        var nodes = [];
        var edges = [];
        var node_queue = [];     // this is only views




        function queryDatabase() {

            // first read views
            const request_db = new Request(
                `SELECT 
            *
        FROM [INFORMATION_SCHEMA].[TABLES]
        WHERE [TABLE_TYPE] IN('VIEW')`,
                (err, rowCount) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`${rowCount} row(s) returned`);

                        //then read tables
                        console.log("table query");
                        connection.execSql(request_table);
                    }
                }
            );

            //make input into json
            request_db.on("row", columns => {
                var input = { 'TABLE_CATALOG': columns[0].value, 'TABLE_SCHEMA': columns[1].value, 'TABLE_NAME': columns[2].value, 'TABLE_TYPE': columns[3].value, 'FULL_TABLE_NAME': columns[0].value + '.' + columns[1].value + '.' + columns[2].value };
                node_queue.push(columns[1].value + '.' + columns[2].value);
                nodes.push(input);
            });



            // second read tables
            const request_table = new Request(
                `SELECT 
            *
        FROM [INFORMATION_SCHEMA].[TABLES]
        WHERE [TABLE_TYPE] IN('BASE TABLE')`,
                (err, rowCount) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`${rowCount} row(s) returned`);
                        //console.log(nodes);

                        let ele = node_queue.pop();
                        var request_edge = create_edge_request(ele);
                        connection.execSql(request_edge);
                    }
                }
            );

            request_table.on("row", columns => {
                var input = { 'TABLE_CATALOG': columns[0].value, 'TABLE_SCHEMA': columns[1].value, 'TABLE_NAME': columns[2].value, 'TABLE_TYPE': 'TABLE', 'FULL_TABLE_NAME': columns[0].value + '.' + columns[1].value + '.' + columns[2].value };
                nodes.push(input);
            });


            function create_edge_request(node_name) {
                const request_table_edges = new Request(
                    `SELECT
                distinct(re.referenced_entity_name) as referenced_view_name, o.type, SCHEMA_NAME(o.schema_id) as schema_name
            FROM
                sys.dm_sql_referenced_entities (
                    '${node_name}',
                    'OBJECT') as re
                            INNER JOIN sys.objects o on  o.name=re.referenced_entity_name`,
                    (err, rowCount) => {
                        if (err) {
                            reject(err);
                        } else {
                            console.log(`${rowCount} row(s) returned`);
                            if (node_queue.length > 0) {
                                let next = node_queue.pop();
                                let request_edge = create_edge_request(next);
                                connection.execSql(request_edge);
                            }
                            else {
                                //console.log(nodes);
                                //console.log(edges);
                                connection.close();
                                enterLastAccessed();
                            }
                        }
                    }
                );

                request_table_edges.on("row", columns => {
                    edges.push({ 'source': selected_database + '.' + node_name, 'target': selected_database + '.' + columns[2].value + '.' + columns[0].value, 'type': columns[1].value, 'source_color': "#17fc03", 'target_color': "#e8b719" });
                });
                return request_table_edges;
            }

            console.log("db query");
            connection.execSql(request_db);

        }
        //====================================================================================Add Last Accessed Date=============================================================================================================
        //====================================================================================Add Last Accessed Date=============================================================================================================
        //====================================================================================Add Last Accessed Date=============================================================================================================
        function enterLastAccessed() {
            console.log('getting last accessed date');
            const log_config = require('./config/log_config');
            const AzureIdentity = require('@azure/identity');
            const AzureAuthorityHosts = AzureIdentity.AzureAuthorityHosts;
            const ClientSecretCredential = AzureIdentity.ClientSecretCredential;
            const AzureMonitorQuery = require('@azure/monitor-query');
            const credential = new ClientSecretCredential(
                log_config.tenant_id,
                log_config.client_id,
                log_config.client_secret,
                { authorityHost: AzureAuthorityHosts.AzureGovernment });
            const logsQueryClient = new AzureMonitorQuery.LogsQueryClient(credential);
            const workspaceId = log_config.workspace_id;

            const result = logsQueryClient.queryWorkspace(
                workspaceId,
                `AzureDiagnostics
                  | where statement_s  has "select" and statement_s has "from" and statement_s !has "sys." and statement_s !has "INFORMATION_SCHEMA" and database_name_s has "${database}"
                  | project statement_s, TimeGenerated, server_instance_name_s, database_name_s, schema_name_s`,  //removed has "VIEW"
                { duration: AzureMonitorQuery.Durations.oneMonth }

            ).then(result => {

                //output
                let rows = result.tables[0].rows;


                for (let arr in rows) {

                    //filter output into 'database.schema.table'
                    let query = rows[arr];
                    let statement = query[0];
                    let statement_lower = statement.toLowerCase();
                    let begin_name = statement.substring(statement_lower.indexOf('from ') + 5);
                    let index_end_name = begin_name.search(/ |'/);
                    if (index_end_name == -1) {
                        index_end_name = begin_name.length;
                    }
                    let full_name = begin_name.substring(0, index_end_name);
                    let database_name = query[3];
                    let full_table_name = database_name + '.' + full_name;
                    
                    let index = nodes.findIndex(function (item) {
                        return item.FULL_TABLE_NAME == full_table_name;
                    });
                    //if the nodes have it, then add day
                    if (index != -1) {
                        let date = query[1];

                        //convert ms to days
                        let days = (new Date() - date) / (1000 * 60 * 60 * 24);
                        days = Math.floor(days);
                        let node = nodes[index];
                        node.LAST_ACCESSED = days;
                    }
                }
                for (let node in nodes) {
                    if (nodes[node].LAST_ACCESSED == undefined) {
                        nodes[node].LAST_ACCESSED = 31;
                    }
                }
                startGremlin();
            });
        }


        //=====================================================================================Add data to Gremlin API on COSMOS DB===============================================================================================
        //=====================================================================================Add data to Gremlin API on COSMOS DB===============================================================================================
        //=====================================================================================Add data to Gremlin API on COSMOS DB===============================================================================================

        const Gremlin = require('gremlin');
        const config2 = require("./config/cosmos_config");

        function startGremlin() {
            console.log('Add data to Cosmos DB');
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

            function cleanGraph() {
                console.log('Drop previous');
                client.submit(`g.V().has('database','${selected_database}').drop()`).then(res => {
                    insertVertices();
                })
            }


            function insertVertex(node) {
                let query = `g.addv('${node.TABLE_TYPE}').property('database', '${node.TABLE_CATALOG}').property('id', '${node.FULL_TABLE_NAME}').property('pk', 'pk').property('schema', '${node.TABLE_SCHEMA}').property('last_accessed','${node.LAST_ACCESSED}')`;
                client.submit(query).then((res) => {
                    //console.log("Result: %s\n", JSON.stringify(res));
                    if (nodes.length > 0) {
                        let next_vertex = nodes.pop();
                        insertVertex(next_vertex);
                    }
                    else {
                        insertEdges();
                    }
                });
            }
            function insertEdge(edge) {
                let query = `g.v('${edge.source}').adde('child').to(g.v('${edge.target}'))`;
                client.submit(query).then((res) => {
                    //console.log("Result: %s\n", JSON.stringify(res));
                    if (edges.length > 0) {
                        let next_edge = edges.pop();
                        insertEdge(next_edge);
                    }
                    else {

                        return return_vertices_edges();
                    }
                });
            }

            function insertEdges() {
                console.log('INSERTING EDGES');
                let edge = edges.pop();
                insertEdge(edge);
            }

            function insertVertices() {
                console.log('INSERTING VERTICES');
                let vertex = nodes.pop();
                insertVertex(vertex);
            }

            function return_vertices_edges() {
                client.submit(`g.V().has('database','${selected_database}')`, {}).then((vertex_res) => {
                    vertices = vertex_res;
                    client.submit(`g.V().has('database','${selected_database}').bothE()`, {}).then((edge_result) => {
                        let edges = edge_result;
                        console.log('Closing Gremlin Connection');
                        client.close();
                        data = { vertices, edges };
                        resolve(data);
                    });
                });
            };
            client.open().then(cleanGraph());
        };
        create_config();
        connection_config.connect();
    })
    
    return promise;
}

module.exports = {
    load_data: sqltest
};