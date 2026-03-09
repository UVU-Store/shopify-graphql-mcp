import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";
import { Product } from "../types/index.js";

export function registerProductTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Products
  server.registerTool(
    "get_products",
    {
      description: "Fetch products from the Shopify store with optional filtering",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of products to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query (e.g., 'title:shirt', 'product_type:clothing')"),
        sortKey: z.enum(["TITLE", "VENDOR", "INVENTORY_TOTAL", "CREATED_AT", "UPDATED_AT", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
          products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                title
                handle
                descriptionHtml
                vendor
                productType
                createdAt
                updatedAt
                status
                totalInventory
                tags
                images(first: 5) {
                  edges {
                    node {
                      id
                      url
                      altText
                    }
                  }
                }
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      sku
                      price
                      inventoryQuantity
                      selectedOptions {
                        name
                        value
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
        const result = await client.execute<{ products: { edges: Array<{ node: Product; cursor: string }>; pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean } } }>(graphqlQuery, { first, after, query, sortKey, reverse });
        
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

  // Get Single Product
  server.registerTool(
    "get_product",
    {
      description: "Fetch a specific product by ID",
      inputSchema: {
        id: z.string().describe("Product ID (e.g., 'gid://shopify/Product/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetProduct($id: ID!) {
          product(id: $id) {
            id
            title
            handle
            descriptionHtml
            vendor
            productType
            createdAt
            updatedAt
            status
            totalInventory
            tags
            seo {
              title
              description
            }
            images(first: 20) {
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
                  sku
                  price
                  compareAtPrice
                  inventoryQuantity
                  selectedOptions {
                    name
                    value
                  }
                  image {
                    id
                    url
                    altText
                  }
                }
              }
            }
            collections(first: 10) {
              edges {
                node {
                  id
                  title
                  handle
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
        const result = await client.execute<{ product: Product }>(graphqlQuery, { id });
        
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

  // Create Product
  server.registerTool(
    "create_product",
    {
      description: "Create a new product in the Shopify store",
      inputSchema: {
        title: z.string().describe("Product title"),
        descriptionHtml: z.string().optional().describe("Product description (HTML)"),
        vendor: z.string().optional().describe("Product vendor"),
        productType: z.string().optional().describe("Product type/category"),
        tags: z.array(z.string()).optional().describe("Product tags"),
        status: z.enum(["ACTIVE", "ARCHIVED", "DRAFT"]).optional().describe("Product status"),
        variants: z.array(z.object({
          title: z.string().describe("Variant title (e.g., 'Small / Blue')"),
          price: z.string().describe("Variant price"),
          sku: z.string().optional().describe("Variant SKU"),
          barcode: z.string().optional().describe("Variant barcode"),
          inventoryQuantity: z.number().optional().describe("Inventory quantity"),
          optionValues: z.array(z.object({
            name: z.string().describe("Option value name (e.g., 'Small', 'Blue')"),
            optionName: z.string().describe("Option name (e.g., 'Size', 'Color')"),
          })).optional().describe("Option values for this variant"),
        })).optional().describe("Product variants (created via bulk API)"),
      },
    },
    async ({ title, descriptionHtml, vendor, productType, tags, status = "DRAFT", variants }) => {
      const createMutation = `
        mutation ProductCreate($input: ProductCreateInput!) {
          productCreate(product: $input) {
            product {
              id
              title
              handle
              descriptionHtml
              vendor
              productType
              status
              createdAt
              updatedAt
              tags
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
      if (vendor) input.vendor = vendor;
      if (productType) input.productType = productType;
      if (tags) input.tags = tags;
      if (status) input.status = status;

      try {
        const createResult = await client.execute(createMutation, { input });
        
        if (createResult.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors: ${JSON.stringify(createResult.errors, null, 2)}` }],
          };
        }

        const productData = (createResult.data as { productCreate?: { product?: { id: string }; userErrors?: Array<{ field: string; message: string }> } })?.productCreate;
        if (productData?.userErrors && productData.userErrors.length > 0) {
          return {
            content: [{ type: "text", text: `User Errors: ${JSON.stringify(productData.userErrors, null, 2)}` }],
          };
        }

        const productId = productData?.product?.id;
        if (!productId) {
          return {
            content: [{ type: "text", text: "Failed to create product" }],
          };
        }

        if (!variants || variants.length === 0) {
          return {
            content: [{ type: "text", text: JSON.stringify(createResult.data, null, 2) }],
          };
        }

        const bulkMutation = `
          mutation ProductVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkCreate(productId: $productId, variants: $variants) {
              product {
                id
                title
                variants(first: 50) {
                  edges {
                    node {
                      id
                      title
                      sku
                      price
                      inventoryQuantity
                    }
                  }
                }
              }
              productVariants {
                id
                title
                sku
                price
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const variantsInput = variants.map(v => ({
          title: v.title,
          price: v.price,
          ...(v.sku && { sku: v.sku }),
          ...(v.barcode && { barcode: v.barcode }),
          ...(v.optionValues && { optionValues: v.optionValues.map(ov => ({
            name: ov.name,
            optionName: ov.optionName,
          })) }),
        }));

        const bulkResult = await client.execute(bulkMutation, { productId, variants: variantsInput });
        
        if (bulkResult.errors) {
          return {
            content: [{ type: "text", text: `Product created but variant creation failed. GraphQL Errors: ${JSON.stringify(bulkResult.errors, null, 2)}` }],
          };

        }

        const bulkData = (bulkResult.data as { productVariantsBulkCreate?: { userErrors?: Array<{ field: string; message: string }> } })?.productVariantsBulkCreate;
        if (bulkData?.userErrors && bulkData.userErrors.length > 0) {
          return {
            content: [{ type: "text", text: `Product created but variant creation had errors: ${JSON.stringify(bulkData.userErrors, null, 2)}` }],
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(bulkResult.data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // Update Product
  server.registerTool(
    "update_product",
    {
      description: "Update an existing product",
      inputSchema: {
        id: z.string().describe("Product ID (e.g., 'gid://shopify/Product/123456789')"),
        title: z.string().optional().describe("Product title"),
        descriptionHtml: z.string().optional().describe("Product description (HTML)"),
        vendor: z.string().optional().describe("Product vendor"),
        productType: z.string().optional().describe("Product type/category"),
        tags: z.array(z.string()).optional().describe("Product tags"),
        status: z.enum(["ACTIVE", "ARCHIVED", "DRAFT"]).optional().describe("Product status"),
      },
    },
    async ({ id, title, descriptionHtml, vendor, productType, tags, status }) => {
      const mutation = `
        mutation ProductUpdate($input: ProductInput!) {
          productUpdate(input: $input) {
            product {
              id
              title
              handle
              descriptionHtml
              vendor
              productType
              status
              updatedAt
              tags
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
      if (vendor) input.vendor = vendor;
      if (productType) input.productType = productType;
      if (tags) input.tags = tags;
      if (status) input.status = status;

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

  // Delete Product
  server.registerTool(
    "delete_product",
    {
      description: "Delete a product from the store",
      inputSchema: {
        id: z.string().describe("Product ID (e.g., 'gid://shopify/Product/123456789')"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation ProductDelete($input: ProductDeleteInput!) {
          productDelete(input: $input) {
            deletedProductId
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
