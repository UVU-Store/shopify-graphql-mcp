import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerCustomerMergeTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Customer Merge Requests
  server.registerTool(
    "get_customer_merge_requests",
    {
      description: "Fetch customer merge requests",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of requests to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"]).optional().describe("Filter by status"),
      },
    },
    async ({ first = 50, after, status }) => {
      const query = `
        query GetCustomerMergeRequests($first: Int!, $after: String, $status: CustomerMergeRequestStatus) {
          customerMergeRequests(first: $first, after: $after, status: $status) {
            edges {
              node {
                id
                status
                sourceCustomerId
                targetCustomerId
                createdAt
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

  // Request Customer Merge
  server.registerTool(
    "request_customer_merge",
    {
      description: "Merge one customer into another (combines order history, addresses, etc.)",
      inputSchema: {
        sourceCustomerId: z.string().describe("Customer ID to merge from (will be deleted)"),
        targetCustomerId: z.string().describe("Customer ID to merge into (will be kept)"),
        note: z.string().optional().describe("Optional note about the merge"),
      },
    },
    async ({ sourceCustomerId, targetCustomerId, note }) => {
      const mutation = `
        mutation CustomerMergeRequestCreate($input: CustomerMergeRequestInput!) {
          customerMergeRequestCreate(input: $input) {
            customerMergeRequest {
              id
              status
              sourceCustomerId
              targetCustomerId
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { sourceCustomerId, targetCustomerId };
      if (note) input.note = note;

      try {
        const result = await client.execute(mutation, { input });
        
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
