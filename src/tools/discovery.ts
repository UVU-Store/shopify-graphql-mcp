import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerDiscoveryTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Products (Discovery/Search)
  server.registerTool(
    "search_products",
    {
      description: "Search products using Shopify's discovery/search functionality",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of products to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().describe("Search query (e.g., 't-shirt', 'category:shirts')"),
        sortKey: z.enum(["TITLE", "PRICE", "BEST_SELLING", "CREATED_AT", "UPDATED_AT", "RELEVANCE"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
        filters: z.array(z.object({
          field: z.string().describe("Filter field (e.g., 'price', 'vendor', 'product_type')"),
          value: z.string().describe("Filter value"),
        })).optional().describe("Additional filters"),
      },
    },
    async ({ first = 50, after, query, sortKey = "RELEVANCE", reverse = false, filters }) => {
      const graphqlQuery = `
        query SearchProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean, $filters: [ProductFilter!]) {
          products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse, filters: $filters) {
            edges {
              node {
                id
                title
                description
                handle
                productType
                vendor
                tags
                status
                createdAt
                updatedAt
                publishedAt
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      sku
                      price
                      compareAtPrice
                      inventoryQuantity
                      availableForSale
                    }
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
                seo {
                  title
                  description
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
        const result = await client.execute(graphqlQuery, { first, after, query, sortKey, reverse, filters });
        
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

  // Get Product Recommendations
  server.registerTool(
    "get_product_recommendations",
    {
      description: "Get product recommendations based on a product",
      inputSchema: {
        productId: z.string().describe("Product ID to get recommendations for"),
        first: z.number().min(1).max(50).optional().describe("Number of recommendations (1-50, default: 10)"),
        intent: z.enum(["RELATED", "COMPLEMENTARY"]).optional().describe("Type of recommendations"),
      },
    },
    async ({ productId, first = 10, intent = "RELATED" }) => {
      const query = `
        query GetProductRecommendations($productId: ID!, $first: Int!, $intent: ProductRecommendationIntent) {
          productRecommendations(productId: $productId, first: $first, intent: $intent) {
            edges {
              node {
                id
                title
                description
                handle
                productType
                vendor
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
                images(first: 1) {
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
          }
        }
      `;

      try {
        const result = await client.execute(query, { productId, first, intent });
        
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

  // Predictive Search
  server.registerTool(
    "predictive_search",
    {
      description: "Get predictive search results (autocomplete)",
      inputSchema: {
        query: z.string().describe("Search query string"),
        first: z.number().min(1).max(50).optional().describe("Number of results (1-50, default: 10)"),
        types: z.array(z.enum(["PRODUCT", "COLLECTION", "PAGE", "ARTICLE", "QUERY"])).optional().describe("Types to search for"),
      },
    },
    async ({ query, first = 10, types = ["PRODUCT", "COLLECTION", "QUERY"] }) => {
      const graphqlQuery = `
        query PredictiveSearch($query: String!, $first: Int!, $types: [PredictiveSearchType!]) {
          predictiveSearch(query: $query, first: $first, types: $types) {
            products {
              edges {
                node {
                  id
                  title
                  handle
                  productType
                  vendor
                  images(first: 1) {
                    edges {
                      node {
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
            collections {
              edges {
                node {
                  id
                  title
                  handle
                  image {
                    url
                    altText
                  }
                }
              }
            }
            pages {
              edges {
                node {
                  id
                  title
                  handle
                }
              }
            }
            articles {
              edges {
                node {
                  id
                  title
                  handle
                  blog {
                    handle
                  }
                }
              }
            }
            queries {
              text
              styledText
              trackingParameters
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { query, first, types });
        
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
