import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerReportTools(server: McpServer, client: ShopifyGraphQLClient) {
  server.registerTool(
    "get_reports",
    {
      description: "Fetch reports from the Shopify store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of reports to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const graphqlQuery = `
        query GetReports($first: Int!, $after: String) {
          reports(first: $first, after: $after) {
            edges {
              node {
                id
                name
                category
                createdAt
                updatedAt
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { first, after });
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.registerTool(
    "get_report",
    {
      description: "Fetch a specific report by ID",
      inputSchema: {
        id: z.string().describe("Report ID (e.g., 'gid://shopify/Report/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetReport($id: ID!) {
          report(id: $id) {
            id
            name
            category
            createdAt
            updatedAt
            graphQLDefinition {
              id
              name
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { id });
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.registerTool(
    "run_report",
    {
      description: "Run a report and get its results",
      inputSchema: {
        id: z.string().describe("Report ID (e.g., 'gid://shopify/Report/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        mutation RunReport($id: ID!) {
          reportRun(id: $id) {
            report {
              id
              name
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { id });
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );
}
