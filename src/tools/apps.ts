import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerAppTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Apps
  server.registerTool(
    "get_apps",
    {
      description: "Fetch installed apps for the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of apps to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        sortKey: z.enum(["TITLE", "INSTALL_DATE", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, sortKey = "INSTALL_DATE", reverse = true }) => {
      const query = `
        query GetApps($first: Int!, $after: String, $sortKey: AppSortKeys, $reverse: Boolean) {
          apps(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                title
                handle
                developerName
                developerType
                installedAt
                uninstallMessage
                pricingDetails
                shopPricingPlan {
                  name
                  price {
                    amount
                    currencyCode
                  }
                }
                appStoreAppUrl
                webhookSubscriptions(first: 10) {
                  edges {
                    node {
                      id
                      topic
                      includeFields
                      filter
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
        const result = await client.execute(query, { first, after, sortKey, reverse });
        
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

  // Get App
  server.registerTool(
    "get_app",
    {
      description: "Fetch a specific installed app by ID",
      inputSchema: {
        id: z.string().describe("App ID (e.g., 'gid://shopify/App/123456789')"),
      },
    },
    async ({ id }) => {
      const query = `
        query GetApp($id: ID!) {
          app(id: $id) {
            id
            title
            handle
            developerName
            developerType
            installedAt
            updatedAt
            description
            appStoreAppUrl
            privacyPolicyUrl
            termsOfServiceUrl
            supportEmail
            supportUrl
            features
            pricingDetails
            shopPricingPlan {
              name
              price {
                amount
                currencyCode
              }
            }
            webhookSubscriptions(first: 50) {
              edges {
                node {
                  id
                  topic
                  includeFields
                  filter
                  callbackUrl
                }
              }
            }
            appProxy {
              url
              subPath
              subPathPrefix
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

  // Get App Proxy
  server.registerTool(
    "get_app_proxy",
    {
      description: "Fetch app proxy configuration for the store",
      inputSchema: {},
    },
    async () => {
      const query = `
        query GetAppProxies {
          shop {
            id
            name
            appProxies(first: 50) {
              edges {
                node {
                  id
                  app {
                    id
                    title
                    handle
                  }
                  url
                  subPath
                  subPathPrefix
                }
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(query, {});
        
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

  // Create App Proxy
  server.registerTool(
    "create_app_proxy",
    {
      description: "Create an app proxy for an app (requires app management permissions)",
      inputSchema: {
        appId: z.string().describe("App ID"),
        url: z.string().describe("Proxy URL"),
        subPath: z.string().describe("Sub-path for the proxy"),
        subPathPrefix: z.enum(["apps", "a", "community", "tools"]).describe("Sub-path prefix"),
      },
    },
    async ({ appId, url, subPath, subPathPrefix }) => {
      const mutation = `
        mutation AppProxyCreate($appId: ID!, $input: AppProxyInput!) {
          appProxyCreate(appId: $appId, input: $input) {
            appProxy {
              id
              url
              subPath
              subPathPrefix
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = { url, subPath, subPathPrefix };

      try {
        const result = await client.execute(mutation, { appId, input });
        
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

  // Update App Proxy
  server.registerTool(
    "update_app_proxy",
    {
      description: "Update an app proxy configuration",
      inputSchema: {
        id: z.string().describe("App Proxy ID"),
        url: z.string().optional().describe("Proxy URL"),
        subPath: z.string().optional().describe("Sub-path for the proxy"),
        subPathPrefix: z.enum(["apps", "a", "community", "tools"]).optional().describe("Sub-path prefix"),
      },
    },
    async ({ id, url, subPath, subPathPrefix }) => {
      const mutation = `
        mutation AppProxyUpdate($id: ID!, $input: AppProxyInput!) {
          appProxyUpdate(id: $id, input: $input) {
            appProxy {
              id
              url
              subPath
              subPathPrefix
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = {};
      if (url) input.url = url;
      if (subPath) input.subPath = subPath;
      if (subPathPrefix) input.subPathPrefix = subPathPrefix;

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

  // Delete App Proxy
  server.registerTool(
    "delete_app_proxy",
    {
      description: "Delete an app proxy",
      inputSchema: {
        id: z.string().describe("App Proxy ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation AppProxyDelete($id: ID!) {
          appProxyDelete(id: $id) {
            deletedAppProxyId
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
