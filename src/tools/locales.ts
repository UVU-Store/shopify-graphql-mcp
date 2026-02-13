import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerLocaleTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Locales
  server.registerTool(
    "get_locales",
    {
      description: "Fetch available locales for the store",
      inputSchema: {
        publishable: z.boolean().optional().describe("Filter to only published locales"),
      },
    },
    async ({ publishable = false }) => {
      const query = `
        query GetLocales($publishable: Boolean) {
          shop {
            id
            name
            locales(publishable: $publishable) {
              locale
              name
              nativeName
              enabled
              published
            }
          }
        }
      `;

      try {
        const result = await client.execute(query, { publishable });
        
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

  // Get Translations
  server.registerTool(
    "get_translations",
    {
      description: "Fetch translations for a locale",
      inputSchema: {
        locale: z.string().describe("Locale code (e.g., 'en', 'fr', 'es')"),
        namespace: z.string().optional().describe("Filter by translation namespace"),
      },
    },
    async ({ locale, namespace }) => {
      const query = `
        query GetTranslations($locale: String!, $namespace: String) {
          translations(locale: $locale, namespace: $namespace) {
            key
            value
            locale
            namespace
          }
        }
      `;

      try {
        const result = await client.execute(query, { locale, namespace });
        
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

  // Publish Locale
  server.registerTool(
    "publish_locale",
    {
      description: "Publish a locale to make it available on the storefront",
      inputSchema: {
        locale: z.string().describe("Locale code to publish"),
      },
    },
    async ({ locale }) => {
      const mutation = `
        mutation LocalePublish($locale: String!) {
          localePublish(locale: $locale) {
            shop {
              id
              locales {
                locale
                name
                nativeName
                enabled
                published
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
        const result = await client.execute(mutation, { locale });
        
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

  // Unpublish Locale
  server.registerTool(
    "unpublish_locale",
    {
      description: "Unpublish a locale",
      inputSchema: {
        locale: z.string().describe("Locale code to unpublish"),
      },
    },
    async ({ locale }) => {
      const mutation = `
        mutation LocaleUnpublish($locale: String!) {
          localeUnpublish(locale: $locale) {
            shop {
              id
              locales {
                locale
                name
                nativeName
                enabled
                published
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
        const result = await client.execute(mutation, { locale });
        
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
