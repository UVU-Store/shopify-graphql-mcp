import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerTranslationTools(server: McpServer, client: ShopifyGraphQLClient) {
  server.registerTool(
    "get_translatable_resources",
    {
      description: "Fetch translatable resources from the store",
      inputSchema: {
        resourceType: z.enum(["PRODUCT", "COLLECTION", "ARTICLE", "PAGE", "BRAND", "SHOP", "METAFIELD_DEFINITION"]).optional().describe("Filter by resource type"),
        first: z.number().min(1).max(250).optional().describe("Number of resources to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ resourceType, first = 50, after }) => {
      const graphqlQuery = `
        query GetTranslatableResources($resourceType: TranslatableResourceType, $first: Int!, $after: String) {
          translatableResources(resourceType: $resourceType, first: $first, after: $after) {
            edges {
              node {
                resourceId
                resourceType
                translatableContent {
                  key
                  value
                  digest
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
        const result = await client.execute(graphqlQuery, { resourceType, first, after });
        
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
    "register_translation",
    {
      description: "Create or update a translation for a resource",
      inputSchema: {
        resourceId: z.string().describe("Resource ID to translate (e.g., 'gid://shopify/Product/123456789')"),
        locale: z.string().describe("ISO code of the locale (e.g., 'fr', 'es', 'de')"),
        key: z.string().describe("Translatable content key"),
        value: z.string().describe("Translated value"),
        marketId: z.string().optional().describe("Market ID for market-specific translation"),
      },
    },
    async ({ resourceId, locale, key, value, marketId }) => {
      const graphqlQuery = `
        mutation RegisterTranslation($resourceId: ID!, $translations: [TranslationInput!]!) {
          translationsRegister(resourceId: $resourceId, translations: $translations) {
            translations {
              key
              locale
              value
              outdated
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const translations = [{
          locale,
          key,
          value,
          translatableContentDigest: "auto",
          ...(marketId && { marketId }),
        }];

        const result = await client.execute(graphqlQuery, { resourceId, translations });
        
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
    "remove_translations",
    {
      description: "Remove translations from a resource",
      inputSchema: {
        resourceId: z.string().describe("Resource ID (e.g., 'gid://shopify/Product/123456789')"),
        translationKeys: z.array(z.string()).describe("Translation keys to remove"),
        locales: z.array(z.string()).describe("Locale codes to remove (e.g., ['fr', 'es'])"),
        marketIds: z.array(z.string()).optional().describe("Market IDs for market-specific translations"),
      },
    },
    async ({ resourceId, translationKeys, locales, marketIds }) => {
      const graphqlQuery = `
        mutation RemoveTranslations($resourceId: ID!, $translationKeys: [String!]!, $locales: [String!]!, $marketIds: [ID!]) {
          translationsRemove(resourceId: $resourceId, translationKeys: $translationKeys, locales: $locales, marketIds: $marketIds) {
            translations {
              key
              locale
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { resourceId, translationKeys, locales, marketIds });
        
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
    "get_translations_for_resource",
    {
      description: "Get translations for a specific resource",
      inputSchema: {
        resourceId: z.string().describe("Resource ID (e.g., 'gid://shopify/Product/123456789')"),
      },
    },
    async ({ resourceId }) => {
      const graphqlQuery = `
        query GetTranslations($id: ID!) {
          translatableResource(id: $id) {
            resourceId
            resourceType
            translatableContent {
              key
              value
              digest
            }
            translations {
              key
              locale
              value
              outdated
              market {
                id
                name
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { id: resourceId });
        
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
