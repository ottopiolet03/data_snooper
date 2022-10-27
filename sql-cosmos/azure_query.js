const AzureIdentity = require("@azure/identity");
const AzureMonitorQuery = require('@azure/monitor-query');
//const LogsQueryClient = require('@azure/monitor-query/logqueryclient');
//const MetricsQueryClient = require("@azure/monitor-query/metricsqueryclient");


const credential = new AzureIdentity.AzurePowerShellCredential();

const logsQueryClient = new AzureMonitorQuery.LogsQueryClient(credential);
const workspaceId = "79d5cb3a-c184-47b9-b8ce-bcc367974d4b";
// or
//const metricsQueryClient = new AzureMonitorQuery.MetricsQueryClient(credential);

const result = logsQueryClient.queryWorkspace(
    workspaceId,
    `AzureDiagnostics
        | where statement_s  has "select" and statement_s has "from" and statement_s !has "sys." and statement_s !has "INFORMATION_SCHEMA" 
        | project statement_s, TimeGenerated`,
    { duration: AzureMonitorQuery.Durations.oneDay }

).then(result => console.log(result.tables[0].rows)); 
