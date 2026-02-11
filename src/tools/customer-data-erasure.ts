import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerCustomerDataErasureTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Customer Data Erasure Requests
  server.registerTool(
    "get_customer_data_erasure_requests",
    {
      description: "Fetch customer data erasure (GDPR) requests",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of requests to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"]).optional().describe("Filter by status"),
      },
    },
    async ({ first = 50, after, status }) => {
      const query = `
        query GetCustomerDataErasureRequests($first: Int!, $after: String, $status: CustomerDataErasureRequestStatus) {
          customerDataErasureRequests(first: $first, after: $after, status: $status) {
            edges {
              node {
                id
                customerId
                status
                requestedAt
                completedAt
                shop {
                  id
                  name
                }
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
        const result = await client.execute(query, { first, after, status });
        
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

  // Request Customer Data Erasure
  server.registerTool(
    "request_customer_data_erasure",
    {
      description: "Submit a customer data erasure request (GDPR right to be forgotten)",
      inputSchema: {
        customerId: z.string().describe("Customer ID to erase data for"),
      },
    },
    async ({ customerId }) => {
      const mutation = `
        mutation CustomerDataErasureRequestCreate($customerId: ID!) {
          customerDataErasureRequestCreate(customerId: $customerId) {
            customerDataErasureRequest {
              id
              customerId
              status
              requestedAt
              shop {
                id
                name
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { customerId });
        
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
