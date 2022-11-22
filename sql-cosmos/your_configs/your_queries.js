

const queries = {
	vertex_query: {
		type: 'sql',
		query: function (server, database) {
			return `SELECT * FROM [INFORMATION_SCHEMA].[TABLES]`
		}
	},
	edge_query: {
		type: 'sql',
		//query that finds edges of singular vertex
		query: function (type, server, database, vertex) {
			return `SELECT
                distinct(re.referenced_entity_name) as referenced_view_name, o.type, SCHEMA_NAME(o.schema_id) as schema_name
            FROM
                sys.dm_sql_referenced_entities (
                    '${vertex}',
                    'OBJECT') as re
                            INNER JOIN sys.objects o on  o.name=re.referenced_entity_name`
		}
	},
	property_querys:[{
						type: 'kql',
						query: function (type, server, database) {
							return `AzureDiagnostics
                  | where statement_s  has "select" and statement_s has "from" and statement_s !has "sys." and statement_s !has "INFORMATION_SCHEMA" and database_name_s has "${database}"
                  | project statement_s, TimeGenerated, server_instance_name_s, database_name_s, schema_name_s`
						}
					}]
	
}

module.exports = queries;