const { Connection, Request } = require("tedious");
const sql_config = require('./config/sql_config');


// Create connection to database
const connection = new Connection(sql_config);



var nodes = [];
var edges = [];
var node_queue = [];     // this is only views


// Attempt to connect and execute queries if connection goes through
connection.on("connect", err => {
    if (err) {
        console.error(err.message);
    } else {
        queryDatabase();

    }
});

connection.connect();

function queryDatabase() {

    // first read views
    const request_db = new Request(
        `SELECT 
            *
        FROM [INFORMATION_SCHEMA].[TABLES]
        WHERE [TABLE_TYPE] IN('VIEW')`,
        (err, rowCount) => {
            if (err) {
                console.error(err.message);
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
        var input = { 'TABLE_CATALOG': columns[0].value, 'TABLE_SCHEMA': columns[1].value, 'TABLE_NAME': columns[2].value, 'TABLE_TYPE': columns[3].value, 'FULL_TABLE_NAME': columns[1].value + '.' + columns[2].value };
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
                console.error(err.message);
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
        var input = { 'TABLE_CATALOG': columns[0].value, 'TABLE_SCHEMA': columns[1].value, 'TABLE_NAME': columns[2].value, 'TABLE_TYPE': columns[3].value, 'FULL_TABLE_NAME': columns[1].value + '.' + columns[2].value };
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
                    console.error(err.message);
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
                        startGremlin();
                    }
                }
            }
        );

        request_table_edges.on("row", columns => {
            edges.push({ 'source': node_name, 'target': columns[2].value + '.' + columns[0].value, 'type': columns[1].value, 'source_color': "#17fc03", 'target_color': "#e8b719" });
        });
        return request_table_edges;
    }

    console.log("db query");
    connection.execSql(request_db);
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
        client.submit('g.V().drop()').then(res => {
            console.log("Result: %s\n", JSON.stringify(res));
            insertVertices();
        });
    }


    function insertVertex(node) {
        let query = `g.addv('${node.TABLE_TYPE}').property('database', '${node.TABLE_CATALOG}').property('id', '${node.FULL_TABLE_NAME}').property('pk', 'pk').property('schema', '${node.TABLE_SCHEMA}')`;
        client.submit(query).then((res) => {
            console.log("Result: %s\n", JSON.stringify(res));
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
            console.log("Result: %s\n", JSON.stringify(res));
            if (edges.length > 0) {
                let next_edge = edges.pop();
                insertEdge(next_edge);
            }
            else {
                client.close();
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


    client.open().then(cleanGraph());

};



