import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerChannelTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Channels
  server.registerTool(
    "get_channels",
    {
      description: "Fetch sales channels for the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of channels to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetChannels($first: Int!, $after: String) {
          channels(first: $first, after: $after) {
            edges {
              node {
                id
                name
                handle
                app {
                  id
                  title
                  handle
                }
                currencyCode
                published
                navigationItems(first: 10) {
                  edges {
                    node {
                      id
                      title
                      url
                      items(first: 5) {
                        edges {
                          node {
                            id
                            title
                            url
                          }
                        }
                      }
                    }
                  }
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

  // Get Channel
  server.registerTool(
    "get_channel",
    {
      description: "Fetch a specific sales channel by ID",
      inputSchema: {
        id: z.string().describe("Channel ID (e.g., 'gid://shopify/Channel/123456789')"),
      },
    },
    async ({ id }) => {
      const query = `
        query GetChannel($id: ID!) {
          channel(id: $id) {
            id
            name
            handle
            app {
              id
              title
              handle
            }
            currencyCode
            published
            navigationItems(first: 20) {
              edges {
                node {
                  id
                  title
                  url
                  items(first: 10) {
                    edges {
                      node {
                        id
                        title
                        url
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(query, { id });
        
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

  // Create Channel
  server.registerTool(
    "create_channel",
    {
      description: "Create a new sales channel (requires app installation)",
      inputSchema: {
        name: z.string().describe("Channel name"),
        handle: z.string().describe("Unique handle for the channel"),
        currencyCode: z.string().optional().describe("Currency code (e.g., 'USD')"),
      },
    },
    async ({ name, handle, currencyCode }) => {
      const mutation = `
        mutation ChannelCreate($input: ChannelInput!) {
          channelCreate(input: $input) {
            channel {
              id
              name
              handle
              currencyCode
              published
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { name, handle };
      if (currencyCode) input.currencyCode = currencyCode;

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

  // Update Channel
  server.registerTool(
    "update_channel",
    {
      description: "Update an existing sales channel",
      inputSchema: {
        id: z.string().describe("Channel ID"),
        name: z.string().optional().describe("Channel name"),
        handle: z.string().optional().describe("Unique handle for the channel"),
        currencyCode: z.string().optional().describe("Currency code (e.g., 'USD')"),
        published: z.boolean().optional().describe("Whether the channel is published"),
      },
    },
    async ({ id, name, handle, currencyCode, published }) => {
      const mutation = `
        mutation ChannelUpdate($id: ID!, $input: ChannelInput!) {
          channelUpdate(id: $id, input: $input) {
            channel {
              id
              name
              handle
              currencyCode
              published
              updatedAt
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
      if (handle) input.handle = handle;
      if (currencyCode) input.currencyCode = currencyCode;
      if (published !== undefined) input.published = published;

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

  // Delete Channel
  server.registerTool(
    "delete_channel",
    {
      description: "Delete a sales channel",
      inputSchema: {
        id: z.string().describe("Channel ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation ChannelDelete($id: ID!) {
          channelDelete(id: $id) {
            deletedChannelId
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
