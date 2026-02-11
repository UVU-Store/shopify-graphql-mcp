import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerAnalyticsTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Analytics Report
  server.registerTool(
    "get_analytics_report",
    {
      description: "Fetch analytics reports and metrics from Shopify",
      inputSchema: {
        reportType: z.enum(["sales", "traffic", "customers", "products", "orders"]).describe("Type of analytics report"),
        startDate: z.string().describe("Start date in ISO format (YYYY-MM-DD)"),
        endDate: z.string().describe("End date in ISO format (YYYY-MM-DD)"),
        granularity: z.enum(["daily", "weekly", "monthly", "yearly"]).optional().describe("Time granularity for the report"),
      },
    },
    async ({ reportType, startDate, endDate, granularity = "daily" }) => {
      const query = `
        query GetAnalytics($startDate: DateTime!, $endDate: DateTime!) {
          shop {
            id
            name
          }
        }
      `;

      try {
        const result = await client.execute(query, { startDate, endDate });
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify({
            reportType,
            period: { startDate, endDate, granularity },
            data: result.data,
            note: "Analytics data requires ShopifyQL queries. Use shopifyql_query tool for detailed analytics."
          }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // ShopifyQL Query
  server.registerTool(
    "run_shopifyql_query",
    {
      description: "Execute a ShopifyQL query for custom analytics and reporting",
      inputSchema: {
        query: z.string().describe("ShopifyQL query string (e.g., 'SHOW total_sales, orders_count FROM sales OVER day SINCE -7d')"),
      },
    },
    async ({ query }) => {
      const graphqlQuery = `
        query RunShopifyQL($query: String!) {
          shopifyqlQuery(query: $query) {
            results {
              columns {
                name
                dataType
              }
              rows
            }
            parseErrors {
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { query });
        
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
