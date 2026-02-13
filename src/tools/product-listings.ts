import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerProductListingTools(server: McpServer, client: ShopifyGraphQLClient) {
  server.registerTool(
    "get_product_listings",
    {
      description: "Fetch product listings from the Shopify store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of listings to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const graphqlQuery = `
        query GetProductListings($first: Int!, $after: String) {
          productListings(first: $first, after: $after) {
            edges {
              node {
                id
                productId
                title
                description
                handle
                productType
                vendor
                tags
                priceRangeV2 {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                images(first: 5) {
                  edges {
                    node {
                      id
                      url
                      altText
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
        const result = await client.execute(graphqlQuery, { first, after });
        
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
    "get_product_listing",
    {
      description: "Fetch a specific product listing by ID",
      inputSchema: {
        id: z.string().describe("Product listing ID (e.g., 'gid://shopify/ProductListing/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetProductListing($id: ID!) {
          productListing(id: $id) {
            id
            productId
            title
            description
            handle
            productType
            vendor
            tags
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 10) {
              edges {
                node {
                  id
                  url
                  altText
                }
              }
            }
            variants(first: 50) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  availableForSale
                  sku
                }
              }
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
    "get_collection_listings",
    {
      description: "Fetch collection listings from the Shopify store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of listings to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const graphqlQuery = `
        query GetCollectionListings($first: Int!, $after: String) {
          collectionListings(first: $first, after: $after) {
            edges {
              node {
                id
                collectionId
                title
                description
                handle
                image {
                  id
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
        const result = await client.execute(graphqlQuery, { first, after });
        
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
