const AzureIdentity = require('@azure/identity');
const AzureAuthorityHosts = AzureIdentity.AzureAuthorityHosts;
const ClientSecretCredential = AzureIdentity.ClientSecretCredential;
const AzureMonitorQuery = require('@azure/monitor-query');

const log_config = require('./config/log_config.js');

const credential = new ClientSecretCredential(
    log_config.tenant_id,
    log_config.client_id,
    log_config.client_secret,
    { authorityHost: AzureAuthorityHosts.AzureGovernment });
const logsQueryClient = new AzureMonitorQuery.LogsQueryClient(credential);
const workspaceId = log_config.workspace_id;
let array = [{ FULL_TABLE_NAME: 'test-sql-snooper.SalesLT.Customer' }]

const result = logsQueryClient.queryWorkspace(
    workspaceId,
    `AzureDiagnostics
        | where statement_s  has "select" and statement_s has "from" and statement_s !has "sys." and statement_s !has "INFORMATION_SCHEMA" 
        | project statement_s, TimeGenerated, server_instance_name_s, database_name_s, schema_name_s, _schema_s`,  //removed has "VIEW"
    { duration: AzureMonitorQuery.Durations.oneMonth }

).then(result => {
    //output
    let rows = result.tables[0].rows; 
    //let headers = result.tables[0].columnDescriptors;
    //console.log(rows)

    for (let arr in rows) {

        //filter output into 'database.schema.table'
        let query = rows[arr];
        console.log(query);
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

        
        let index = array.findIndex(function (item) {
            return item.FULL_TABLE_NAME == full_table_name;
        });
        //if the nodes have it, then add day
        if (index != -1) {
            let date = query[1];

            //convert ms to days
            let days = (new Date() - date) / (1000 * 60 * 60 * 24);
            days = Math.floor(days);
            let node = array[index];
            node.last_accessed = days;
        }
    }
}); 




