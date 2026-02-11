import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerCustomFulfillmentServiceTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Custom Fulfillment Services
  server.registerTool(
    "get_custom_fulfillment_services",
    {
      description: "Fetch custom fulfillment services for the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of services to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetFulfillmentServices($first: Int!, $after: String) {
          fulfillmentServices(first: $first, after: $after) {
            edges {
              node {
                id
                handle
                name
                email
                serviceName
                location {
                  id
                  name
                  address {
                    address1
                    city
                    province
                    country
                    zip
                  }
                }
                productBased
                inventoryManagement
                trackingSupport
                fulfillmentOrdersOptIn
                permitsSkuSharing
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
        const result = await client.execute(query, { first, after });
        
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

  // Create Custom Fulfillment Service
  server.registerTool(
    "create_custom_fulfillment_service",
    {
      description: "Create a new custom fulfillment service",
      inputSchema: {
        name: z.string().describe("Service name"),
        handle: z.string().describe("Unique handle for the service"),
        email: z.string().email().describe("Service email address"),
        locationId: z.string().describe("Location ID for the service"),
        productBased: z.boolean().optional().describe("Whether the service is product-based (default: true)"),
        inventoryManagement: z.boolean().optional().describe("Whether the service manages inventory (default: false)"),
        trackingSupport: z.boolean().optional().describe("Whether the service supports tracking (default: true)"),
        fulfillmentOrdersOptIn: z.boolean().optional().describe("Whether to opt-in to fulfillment orders (default: true)"),
      },
    },
    async ({ name, handle, email, locationId, productBased = true, inventoryManagement = false, trackingSupport = true, fulfillmentOrdersOptIn = true }) => {
      const mutation = `
        mutation FulfillmentServiceCreate($input: FulfillmentServiceInput!) {
          fulfillmentServiceCreate(input: $input) {
            fulfillmentService {
              id
              handle
              name
              email
              serviceName
              location {
                id
                name
              }
              productBased
              inventoryManagement
              trackingSupport
              fulfillmentOrdersOptIn
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = {
        name,
        handle,
        email,
        locationId,
        productBased,
        inventoryManagement,
        trackingSupport,
        fulfillmentOrdersOptIn,
      };

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

  // Update Custom Fulfillment Service
  server.registerTool(
    "update_custom_fulfillment_service",
    {
      description: "Update an existing custom fulfillment service",
      inputSchema: {
        id: z.string().describe("Fulfillment Service ID"),
        name: z.string().optional().describe("Service name"),
        email: z.string().email().optional().describe("Service email address"),
        trackingSupport: z.boolean().optional().describe("Whether the service supports tracking"),
        fulfillmentOrdersOptIn: z.boolean().optional().describe("Whether to opt-in to fulfillment orders"),
      },
    },
    async ({ id, name, email, trackingSupport, fulfillmentOrdersOptIn }) => {
      const mutation = `
        mutation FulfillmentServiceUpdate($id: ID!, $input: FulfillmentServiceInput!) {
          fulfillmentServiceUpdate(id: $id, input: $input) {
            fulfillmentService {
              id
              handle
              name
              email
              trackingSupport
              fulfillmentOrdersOptIn
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = {};
      if (name) input.name = name;
      if (email) input.email = email;
      if (trackingSupport !== undefined) input.trackingSupport = trackingSupport;
      if (fulfillmentOrdersOptIn !== undefined) input.fulfillmentOrdersOptIn = fulfillmentOrdersOptIn;

      try {
        const result = await client.execute(mutation, { id, input });
        
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

  // Delete Custom Fulfillment Service
  server.registerTool(
    "delete_custom_fulfillment_service",
    {
      description: "Delete a custom fulfillment service",
      inputSchema: {
        id: z.string().describe("Fulfillment Service ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation FulfillmentServiceDelete($id: ID!) {
          fulfillmentServiceDelete(id: $id) {
            deletedFulfillmentServiceId
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { id });
        
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
