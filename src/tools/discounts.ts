import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerDiscountTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Discounts
  server.registerTool(
    "get_discounts",
    {
      description: "Fetch discount codes from the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of discounts to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, reverse = true }) => {
      const graphqlQuery = `
        query GetDiscounts($first: Int!, $after: String, $query: String, $reverse: Boolean) {
          codeDiscountNodes(first: $first, after: $after, query: $query, reverse: $reverse) {
            edges {
              node {
                id
                codeDiscount {
                  ... on DiscountCodeBasic {
                    title
                    status
                    createdAt
                    updatedAt
                    startsAt
                    endsAt
                    customerSelection {
                      ... on DiscountCustomerAll {
                        allCustomers
                      }
                    }
                    customerGets {
                      items {
                        ... on AllDiscountItems {
                          allItems
                        }
                      }
                      value {
                        ... on DiscountPercentage {
                          percentage
                        }
                        ... on DiscountAmount {
                          amount
                          appliesOnEachItem
                        }
                      }
                    }
                  }
                  ... on DiscountCodeBxgy {
                    title
                    status
                    createdAt
                    updatedAt
                    startsAt
                    endsAt
                  }
                  ... on DiscountCodeFreeShipping {
                    title
                    status
                    createdAt
                    updatedAt
                    startsAt
                    endsAt
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
        const result = await client.execute(graphqlQuery, { first, after, query, reverse });
        
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

  // Get Single Discount
  server.registerTool(
    "get_discount_code",
    {
      description: "Fetch a specific discount code by ID",
      inputSchema: {
        id: z.string().describe("Discount ID (e.g., 'gid://shopify/DiscountCodeNode/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetDiscountCode($id: ID!) {
          codeDiscountNode(id: $id) {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
                title
                status
                createdAt
                updatedAt
                startsAt
                endsAt
                usageLimit
                appliesOncePerCustomer
                customerSelection {
                  ... on DiscountCustomerAll {
                    allCustomers
                  }
                }
                customerGets {
                  items {
                    ... on AllDiscountItems {
                      allItems
                    }
                  }
                  value {
                    ... on DiscountPercentage {
                      percentage
                    }
                    ... on DiscountAmount {
                      amount
                      appliesOnEachItem
                    }
                  }
                }
              }
              ... on DiscountCodeBxgy {
                title
                status
                createdAt
                updatedAt
                startsAt
                endsAt
              }
              ... on DiscountCodeFreeShipping {
                title
                status
                createdAt
                updatedAt
                startsAt
                endsAt
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

  // Create Basic Discount
  server.registerTool(
    "create_discount",
    {
      description: "Create a basic discount code (percentage or fixed amount)",
      inputSchema: {
        title: z.string().describe("Discount title"),
        code: z.string().describe("Discount code (what customers enter)"),
        discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).describe("Type of discount"),
        value: z.string().describe("Discount value (e.g., '10' for 10% or $10)"),
        startsAt: z.string().describe("Start date (ISO 8601 format)"),
        endsAt: z.string().optional().describe("End date (ISO 8601 format)"),
        minimumRequirement: z.enum(["NONE", "MINIMUM_PURCHASE_AMOUNT", "MINIMUM_QUANTITY_ITEMS"]).optional().describe("Minimum purchase requirement"),
        minimumSubtotal: z.string().optional().describe("Minimum purchase amount (if applicable)"),
        appliesOncePerCustomer: z.boolean().optional().describe("Limit to one use per customer"),
        usageLimit: z.number().optional().describe("Total number of times this code can be used"),
      },
    },
    async ({ title, code, discountType, value, startsAt, endsAt, minimumRequirement = "NONE", minimumSubtotal, appliesOncePerCustomer = false, usageLimit }) => {
      const mutation = `
        mutation DiscountCodeBasicCreate($input: DiscountCodeBasicInput!) {
          discountCodeBasicCreate(input: $input) {
            codeDiscountNode {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  title
                  status
                  createdAt
                  startsAt
                  endsAt
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
        code,
        startsAt,
        customerSelection: {
          all: true,
        },
        customerGets: {
          items: {
            all: true,
          },
          value: discountType === "PERCENTAGE" 
            ? { percentage: parseFloat(value) }
            : { discountAmount: { amount: value, appliesOnEachItem: false } },
        },
        appliesOncePerCustomer,
      };

      if (endsAt) input.endsAt = endsAt;
      if (usageLimit) input.usageLimit = usageLimit;
      
      if (minimumRequirement === "MINIMUM_PURCHASE_AMOUNT" && minimumSubtotal) {
        input.minimumRequirement = {
          subtotal: {
            greaterThanOrEqualToSubtotal: minimumSubtotal,
          },
        };
      }

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

  // Update Discount
  server.registerTool(
    "update_discount_code",
    {
      description: "Update an existing discount code",
      inputSchema: {
        id: z.string().describe("Discount ID (e.g., 'gid://shopify/DiscountCodeNode/123456789')"),
        title: z.string().optional().describe("Discount title"),
        startsAt: z.string().optional().describe("Start date (ISO 8601 format)"),
        endsAt: z.string().optional().describe("End date (ISO 8601 format)"),
        status: z.enum(["ACTIVE", "EXPIRED"]).optional().describe("Discount status"),
        usageLimit: z.number().optional().describe("Total number of times this code can be used"),
        appliesOncePerCustomer: z.boolean().optional().describe("Limit to one use per customer"),
      },
    },
    async ({ id, title, startsAt, endsAt, status, usageLimit, appliesOncePerCustomer }) => {
      const mutation = `
        mutation DiscountCodeBasicUpdate($id: ID!, $input: DiscountCodeBasicInput!) {
          discountCodeBasicUpdate(id: $id, input: $input) {
            codeDiscountNode {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  title
                  status
                  createdAt
                  updatedAt
                  startsAt
                  endsAt
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

      const input: Record<string, unknown> = {};
      if (title) input.title = title;
      if (startsAt) input.startsAt = startsAt;
      if (endsAt !== undefined) input.endsAt = endsAt;
      if (status) input.status = status;
      if (usageLimit !== undefined) input.usageLimit = usageLimit;
      if (appliesOncePerCustomer !== undefined) input.appliesOncePerCustomer = appliesOncePerCustomer;

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

  // Delete Discount
  server.registerTool(
    "delete_discount",
    {
      description: "Delete a discount code",
      inputSchema: {
        id: z.string().describe("Discount ID (e.g., 'gid://shopify/DiscountCodeNode/123456789')"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation DiscountCodeDelete($id: ID!) {
          discountCodeDelete(id: $id) {
            deletedCodeDiscountId
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

  // Get Discounts Allocator Functions
  server.registerTool(
    "get_discounts_allocator_functions",
    {
      description: "Fetch discounts allocator functions for the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of functions to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetDiscountsAllocatorFunctions($first: Int!, $after: String) {
          discountsAllocators(first: $first, after: $after) {
            edges {
              node {
                id
                functionId
                metafields(first: 10) {
                  edges {
                    node {
                      id
                      namespace
                      key
                      value
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

  // Create Discounts Allocator Function
  server.registerTool(
    "create_discounts_allocator_function",
    {
      description: "Create a discounts allocator function using a Shopify Function",
      inputSchema: {
        functionId: z.string().describe("ID of the discounts allocator function to use"),
        metafields: z.array(z.object({
          namespace: z.string().describe("Metafield namespace"),
          key: z.string().describe("Metafield key"),
          value: z.string().describe("Metafield value"),
          type: z.string().describe("Metafield type"),
        })).optional().describe("Configuration metafields for the function"),
      },
    },
    async ({ functionId, metafields }) => {
      const mutation = `
        mutation DiscountsAllocatorCreate($input: DiscountsAllocatorInput!) {
          discountsAllocatorCreate(input: $input) {
            discountsAllocator {
              id
              functionId
              metafields(first: 10) {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
                  }
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

      const input: Record<string, unknown> = { functionId };
      if (metafields && metafields.length > 0) {
        input.metafields = metafields;
      }

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
}
