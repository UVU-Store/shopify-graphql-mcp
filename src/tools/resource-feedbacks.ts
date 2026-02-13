import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerResourceFeedbackTools(server: McpServer, client: ShopifyGraphQLClient) {
  server.registerTool(
    "get_resource_feedbacks",
    {
      description: "Fetch resource feedbacks from the Shopify store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of feedbacks to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        resourceType: z.enum(["PRODUCT", "COLLECTION"]).optional().describe("Filter by resource type"),
      },
    },
    async ({ first = 50, after, resourceType }) => {
      const graphqlQuery = `
        query GetResourceFeedbacks($first: Int!, $after: String, $resourceType: ResourceType) {
          resourceFeedbacks(first: $first, after: $after, resourceType: $resourceType) {
            edges {
              node {
                id
                resourceId
                resourceType
                state
                feedbackGeneratedAt
                messages
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
        const result = await client.execute(graphqlQuery, { first, after, resourceType });
        
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
    "create_resource_feedback",
    {
      description: "Create a resource feedback",
      inputSchema: {
        resourceId: z.string().describe("Resource ID (e.g., 'gid://shopify/Product/123456789')"),
        resourceType: z.enum(["PRODUCT", "COLLECTION"]).describe("Resource type"),
        state: z.enum(["success", "warning", "error"]).describe("Feedback state"),
        messages: z.array(z.string()).describe("Feedback messages"),
      },
    },
    async ({ resourceId, resourceType, state, messages }) => {
      const graphqlQuery = `
        mutation CreateResourceFeedback($input: ResourceFeedbackInput!) {
          resourceFeedbackCreate(input: $input) {
            resourceFeedback {
              id
              resourceId
              resourceType
              state
              messages
              feedbackGeneratedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { 
          input: { resourceId, resourceType, state, messages } 
        });
        
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
