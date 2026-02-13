import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";
import { Collection } from "../types/index.js";

export function registerCollectionTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Collections
  server.registerTool(
    "get_collections",
    {
      description: "Fetch collections from the Shopify store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of collections to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query"),
        sortKey: z.enum(["TITLE", "UPDATED_AT", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "UPDATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetCollections($first: Int!, $after: String, $query: String, $sortKey: CollectionSortKeys, $reverse: Boolean) {
          collections(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                title
                handle
                descriptionHtml
                productsCount
                sortOrder
                updatedAt
                image {
                  url
                  altText
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
        const result = await client.execute<{ collections: { edges: Array<{ node: Collection; cursor: string }>; pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean } } }>(graphqlQuery, { first, after, query, sortKey, reverse });
        
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

  // Get Single Collection
  server.registerTool(
    "get_collection",
    {
      description: "Fetch a specific collection by ID",
      inputSchema: {
        id: z.string().describe("Collection ID (e.g., 'gid://shopify/Collection/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetCollection($id: ID!) {
          collection(id: $id) {
            id
            title
            handle
            descriptionHtml
            productsCount
            sortOrder
            updatedAt
            image {
              url
              altText
            }
            products(first: 20) {
              edges {
                node {
                  id
                  title
                  handle
                  vendor
                  productType
                  featuredImage {
                    url
                    altText
                  }
                }
              }
            }
            metafields(first: 10) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                  type
                }
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute<{ collection: Collection }>(graphqlQuery, { id });
        
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

  // Create Collection
  server.registerTool(
    "create_collection",
    {
      description: "Create a new collection (manual or smart collection)",
      inputSchema: {
        title: z.string().describe("Collection title"),
        descriptionHtml: z.string().optional().describe("Collection description (HTML)"),
        collectionType: z.enum(["MANUAL", "SMART"]).describe("Type of collection"),
        rules: z.array(z.object({
          column: z.enum(["TITLE", "TYPE", "VENDOR", "VARIANT_PRICE", "TAG"]),
          relation: z.enum(["CONTAINS", "ENDS_WITH", "EQUALS", "GREATER_THAN", "IS_NOT_SET", "LESS_THAN", "NOT_CONTAINS", "NOT_EQUALS", "STARTS_WITH"]),
          condition: z.string(),
        })).optional().describe("Rules for smart collections"),
        disjunctive: z.boolean().optional().describe("Whether rules should be OR'd together (default: AND)"),
      },
    },
    async ({ title, descriptionHtml, collectionType, rules, disjunctive }) => {
      if (collectionType === "SMART") {
        // Create smart collection
        const mutation = `
          mutation CollectionCreate($input: CollectionInput!) {
            collectionCreate(input: $input) {
              collection {
                id
                title
                handle
                descriptionHtml
                updatedAt
                productsCount
                ruleSet {
                  appliedDisjunctively
                  rules {
                    column
                    relation
                    condition
                  }
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const input: Record<string, unknown> = { 
          title,
          ruleSet: {
            appliedDisjunctively: disjunctive || false,
            rules: rules || [],
          },
        };
        if (descriptionHtml) input.descriptionHtml = descriptionHtml;

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
      } else {
        // Create manual collection
        const mutation = `
          mutation CollectionCreate($input: CollectionInput!) {
            collectionCreate(input: $input) {
              collection {
                id
                title
                handle
                descriptionHtml
                updatedAt
                productsCount
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const input: Record<string, unknown> = { title };
        if (descriptionHtml) input.descriptionHtml = descriptionHtml;

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
    }
  );

  // Add Products to Collection
  server.registerTool(
    "add_products_to_collection",
    {
      description: "Add products to a manual collection",
      inputSchema: {
        collectionId: z.string().describe("Collection ID"),
        productIds: z.array(z.string()).min(1).describe("Array of product IDs to add"),
      },
    },
    async ({ collectionId, productIds }) => {
      const mutation = `
        mutation CollectionAddProducts($input: CollectionAddProductsInput!) {
          collectionAddProducts(input: $input) {
            collection {
              id
              title
              productsCount
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = {
        id: collectionId,
        productIds,
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

  // Update Collection
  server.registerTool(
    "update_collection",
    {
      description: "Update an existing collection",
      inputSchema: {
        id: z.string().describe("Collection ID (e.g., 'gid://shopify/Collection/123456789')"),
        title: z.string().optional().describe("Collection title"),
        descriptionHtml: z.string().optional().describe("Collection description (HTML)"),
        sortOrder: z.enum(["MANUAL", "BEST_SELLING", "ALPHA_ASC", "ALPHA_DESC", "PRICE_ASC", "PRICE_DESC", "CREATED", "CREATED_DESC"]).optional().describe("Product sort order"),
      },
    },
    async ({ id, title, descriptionHtml, sortOrder }) => {
      const mutation = `
        mutation CollectionUpdate($input: CollectionInput!) {
          collectionUpdate(input: $input) {
            collection {
              id
              title
              handle
              descriptionHtml
              sortOrder
              updatedAt
              productsCount
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { id };
      if (title) input.title = title;
      if (descriptionHtml) input.descriptionHtml = descriptionHtml;
      if (sortOrder) input.sortOrder = sortOrder;

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

  // Delete Collection
  server.registerTool(
    "delete_collection",
    {
      description: "Delete a collection",
      inputSchema: {
        id: z.string().describe("Collection ID (e.g., 'gid://shopify/Collection/123456789')"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation CollectionDelete($input: CollectionDeleteInput!) {
          collectionDelete(input: $input) {
            deletedCollectionId
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { input: { id } });
        
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
