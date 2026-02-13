import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerThemeTools(server: McpServer, client: ShopifyGraphQLClient) {
  server.registerTool(
    "get_themes",
    {
      description: "Fetch themes from the Shopify store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of themes to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        role: z.enum(["MAIN", "UNPUBLISHED", "DEMO", "DEVELOPMENT"]).optional().describe("Filter by theme role"),
        name: z.string().optional().describe("Filter by theme name"),
      },
    },
    async ({ first = 50, after, role, name }) => {
      const graphqlQuery = `
        query GetThemes($first: Int!, $after: String, $roles: [ThemeRole!], $names: [String!]) {
          themes(first: $first, after: $after, roles: $roles, names: $names) {
            edges {
              node {
                id
                name
                role
                createdAt
                updatedAt
                processing
                processingFailed
                prefix
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
        const result = await client.execute(graphqlQuery, { first, after, roles: role ? [role] : undefined, names: name ? [name] : undefined });
        
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
    "get_theme",
    {
      description: "Fetch a specific theme by ID",
      inputSchema: {
        id: z.string().describe("Theme ID (e.g., 'gid://shopify/OnlineStoreTheme/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetTheme($id: ID!) {
          theme(id: $id) {
            id
            name
            role
            createdAt
            updatedAt
            processing
            processingFailed
            prefix
            themeStoreId
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
    "create_theme",
    {
      description: "Create a new theme",
      inputSchema: {
        source: z.string().url().describe("URL to the theme ZIP file"),
        name: z.string().optional().describe("Theme name"),
        role: z.enum(["MAIN", "UNPUBLISHED", "DEMO", "DEVELOPMENT"]).optional().describe("Theme role"),
      },
    },
    async ({ source, name, role = "UNPUBLISHED" }) => {
      const graphqlQuery = `
        mutation CreateTheme($source: URL!, $name: String, $role: ThemeRole) {
          themeCreate(source: $source, name: $name, role: $role) {
            theme {
              id
              name
              role
              createdAt
              processing
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { source, name, role });
        
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
    "update_theme",
    {
      description: "Update an existing theme",
      inputSchema: {
        id: z.string().describe("Theme ID (e.g., 'gid://shopify/OnlineStoreTheme/123456789')"),
        name: z.string().optional().describe("Theme name"),
        role: z.enum(["MAIN", "UNPUBLISHED", "DEMO", "DEVELOPMENT"]).optional().describe("Theme role"),
      },
    },
    async ({ id, name, role }) => {
      const graphqlQuery = `
        mutation UpdateTheme($id: ID!, $input: OnlineStoreThemeInput!) {
          themeUpdate(id: $id, input: $input) {
            theme {
              id
              name
              role
              updatedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const input: Record<string, unknown> = {};
        if (name) input.name = name;
        if (role) input.role = role;

        const result = await client.execute(graphqlQuery, { id, input });
        
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
    "publish_theme",
    {
      description: "Publish a theme (make it the main theme)",
      inputSchema: {
        id: z.string().describe("Theme ID (e.g., 'gid://shopify/OnlineStoreTheme/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        mutation PublishTheme($id: ID!) {
          themePublish(id: $id) {
            theme {
              id
              name
              role
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

  server.registerTool(
    "delete_theme",
    {
      description: "Delete a theme",
      inputSchema: {
        id: z.string().describe("Theme ID (e.g., 'gid://shopify/OnlineStoreTheme/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        mutation DeleteTheme($id: ID!) {
          themeDelete(id: $id) {
            deletedThemeId
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

  server.registerTool(
    "get_theme_files",
    {
      description: "Fetch files from a theme",
      inputSchema: {
        themeId: z.string().describe("Theme ID (e.g., 'gid://shopify/OnlineStoreTheme/123456789')"),
        filenames: z.array(z.string()).optional().describe("Specific files to fetch"),
        first: z.number().min(1).max(250).optional().describe("Number of files to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ themeId, filenames, first = 50, after }) => {
      const graphqlQuery = `
        query GetThemeFiles($themeId: ID!, $filenames: [String!], $first: Int!, $after: String) {
          theme(id: $themeId) {
            id
            name
            files(filenames: $filenames, first: $first, after: $after) {
              edges {
                node {
                  id
                  filename
                  contentType
                  createdAt
                  updatedAt
                  size
                }
                cursor
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { themeId, filenames, first, after });
        
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
    "get_theme_file",
    {
      description: "Fetch a specific file from a theme",
      inputSchema: {
        themeId: z.string().describe("Theme ID (e.g., 'gid://shopify/OnlineStoreTheme/123456789')"),
        filename: z.string().describe("Filename of the theme file (e.g., 'sections/header.liquid')"),
      },
    },
    async ({ themeId, filename }) => {
      const graphqlQuery = `
        query GetThemeFile($themeId: ID!, $filename: String!) {
          theme(id: $themeId) {
            id
            name
            files(filenames: [$filename], first: 1) {
              edges {
                node {
                  id
                  filename
                  contentType
                  body {
                    ... on OnlineStoreThemeFileBodyText {
                      value
                    }
                    ... on OnlineStoreThemeFileBodyJson {
                      value
                    }
                  }
                  createdAt
                  updatedAt
                  size
                }
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { themeId, filename });
        
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
    "upsert_theme_file",
    {
      description: "Create or update a theme file",
      inputSchema: {
        themeId: z.string().describe("Theme ID (e.g., 'gid://shopify/OnlineStoreTheme/123456789')"),
        filename: z.string().describe("Filename (e.g., 'sections/header.liquid')"),
        content: z.string().describe("File content"),
        contentType: z.enum(["JSON", "TEXT", "CSS", "LIQUID", "SVG", "JPG", "PNG", "WEBP", "ICO"]).describe("Content type"),
      },
    },
    async ({ themeId, filename, content, contentType }) => {
      const graphqlQuery = `
        mutation UpsertThemeFiles($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
          themeFilesUpsert(themeId: $themeId, files: $files) {
            job {
              id
              done
            }
            upsertedThemeFiles {
              filename
              valid
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
          themeId, 
          files: [{ filename, body: { type: contentType, value: content } }] 
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
