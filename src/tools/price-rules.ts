import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerPriceRuleTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Price Rules
  server.registerTool(
    "get_price_rules",
    {
      description: "Fetch price rules for automatic discounts",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of price rules to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query (e.g., 'status:active', 'title:Summer Sale')"),
        sortKey: z.enum(["CREATED_AT", "STARTS_AT", "ENDS_AT", "TITLE", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetPriceRules($first: Int!, $after: String, $query: String, $sortKey: PriceRuleSortKeys, $reverse: Boolean) {
          priceRules(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                title
                status
                createdAt
                updatedAt
                startsAt
                endsAt
                target
                allocationMethod
                valueType
                value
                oncePerCustomer
                usageLimit
                customerSelection
                prerequisiteSubtotalRange {
                  greaterThanOrEqualTo
                  lessThanOrEqualTo
                }
                prerequisiteQuantityRange {
                  greaterThanOrEqualTo
                  lessThanOrEqualTo
                }
                prerequisiteToEntitlementQuantityRatio {
                  prerequisiteQuantity
                  entitledQuantity
                }
                itemEntitlements(first: 50) {
                  edges {
                    node {
                      ... on Collection {
                        id
                        title
                      }
                      ... on Product {
                        id
                        title
                      }
                    }
                  }
                }
                customerGets {
                  items {
                    ... on AllDiscountItems {
                      allItems
                    }
                  }
                  value {
                    ... on DiscountAmount {
                      amount
                      appliesOnEachItem
                    }
                    ... on DiscountPercentage {
                      percentage
                    }
                  }
                }
                discountCodes(first: 50) {
                  edges {
                    node {
                      id
                      code
                      usageCount
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
        const result = await client.execute(graphqlQuery, { first, after, query, sortKey, reverse });
        
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

  // Get Price Rule
  server.registerTool(
    "get_price_rule",
    {
      description: "Fetch a specific price rule by ID",
      inputSchema: {
        id: z.string().describe("Price Rule ID (e.g., 'gid://shopify/PriceRule/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetPriceRule($id: ID!) {
          priceRule(id: $id) {
            id
            title
            status
            createdAt
            updatedAt
            startsAt
            endsAt
            target
            allocationMethod
            valueType
            value
            oncePerCustomer
            usageLimit
            customerSelection
            prerequisiteSubtotalRange {
              greaterThanOrEqualTo
              lessThanOrEqualTo
            }
            prerequisiteQuantityRange {
              greaterThanOrEqualTo
              lessThanOrEqualTo
            }
            prerequisiteToEntitlementQuantityRatio {
              prerequisiteQuantity
              entitledQuantity
            }
            itemEntitlements(first: 100) {
              edges {
                node {
                  ... on Collection {
                    id
                    title
                  }
                  ... on Product {
                    id
                    title
                  }
                }
              }
            }
            customerGets {
              items {
                ... on AllDiscountItems {
                  allItems
                }
              }
              value {
                ... on DiscountAmount {
                  amount
                  appliesOnEachItem
                }
                ... on DiscountPercentage {
                  percentage
                }
              }
            }
            discountCodes(first: 100) {
              edges {
                node {
                  id
                  code
                  usageCount
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

  // Create Price Rule
  server.registerTool(
    "create_price_rule",
    {
      description: "Create a new price rule for automatic discounts",
      inputSchema: {
        title: z.string().describe("Price rule title"),
        target: z.enum(["LINE_ITEM", "SHIPPING_LINE"]).describe("What the discount applies to"),
        allocationMethod: z.enum(["ACROSS", "EACH"]).describe("How to allocate the discount"),
        valueType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).describe("Type of discount value"),
        value: z.number().describe("Discount value (percentage or fixed amount)"),
        startsAt: z.string().optional().describe("Start date/time (ISO format)"),
        endsAt: z.string().optional().describe("End date/time (ISO format)"),
        oncePerCustomer: z.boolean().optional().describe("Limit to one use per customer"),
        usageLimit: z.number().optional().describe("Total usage limit"),
        prerequisiteSubtotalMin: z.number().optional().describe("Minimum subtotal required"),
      },
    },
    async ({ title, target, allocationMethod, valueType, value, startsAt, endsAt, oncePerCustomer, usageLimit, prerequisiteSubtotalMin }) => {
      const mutation = `
        mutation PriceRuleCreate($input: PriceRuleInput!) {
          priceRuleCreate(input: $input) {
            priceRule {
              id
              title
              status
              createdAt
              startsAt
              endsAt
              target
              allocationMethod
              valueType
              value
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
        target,
        allocationMethod,
        valueType,
        value,
      };

      if (startsAt) input.startsAt = startsAt;
      if (endsAt) input.endsAt = endsAt;
      if (oncePerCustomer !== undefined) input.oncePerCustomer = oncePerCustomer;
      if (usageLimit) input.usageLimit = usageLimit;
      if (prerequisiteSubtotalMin) {
        input.prerequisiteSubtotalRange = { greaterThanOrEqualTo: prerequisiteSubtotalMin };
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

  // Update Price Rule
  server.registerTool(
    "update_price_rule",
    {
      description: "Update an existing price rule",
      inputSchema: {
        id: z.string().describe("Price Rule ID"),
        title: z.string().optional().describe("Price rule title"),
        startsAt: z.string().optional().describe("Start date/time (ISO format)"),
        endsAt: z.string().optional().describe("End date/time (ISO format)"),
        oncePerCustomer: z.boolean().optional().describe("Limit to one use per customer"),
        usageLimit: z.number().optional().describe("Total usage limit"),
      },
    },
    async ({ id, title, startsAt, endsAt, oncePerCustomer, usageLimit }) => {
      const mutation = `
        mutation PriceRuleUpdate($id: ID!, $input: PriceRuleInput!) {
          priceRuleUpdate(id: $id, input: $input) {
            priceRule {
              id
              title
              status
              updatedAt
              startsAt
              endsAt
              oncePerCustomer
              usageLimit
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
      if (endsAt) input.endsAt = endsAt;
      if (oncePerCustomer !== undefined) input.oncePerCustomer = oncePerCustomer;
      if (usageLimit !== undefined) input.usageLimit = usageLimit;

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

  // Delete Price Rule
  server.registerTool(
    "delete_price_rule",
    {
      description: "Delete a price rule",
      inputSchema: {
        id: z.string().describe("Price Rule ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation PriceRuleDelete($id: ID!) {
          priceRuleDelete(id: $id) {
            deletedPriceRuleId
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
