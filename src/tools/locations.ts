import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerLocationTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Locations
  server.registerTool(
    "get_locations",
    {
      description: "Fetch store locations",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of locations to fetch (default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query"),
        includeInactive: z.boolean().optional().describe("Include inactive locations"),
      },
    },
    async ({ first = 50, after, query, includeInactive = false }) => {
      const graphqlQuery = `
        query GetLocations($first: Int!, $after: String, $query: String, $includeInactive: Boolean) {
          locations(first: $first, after: $after, query: $query, includeInactive: $includeInactive) {
            edges {
              node {
                id
                name
                address {
                  address1
                  address2
                  city
                  province
                  country
                  zip
                  phone
                }
                isActive
                isPrimary
                fulfillsOnlineOrders
                createdAt
                updatedAt
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
        const result = await client.execute(graphqlQuery, { first, after, query, includeInactive });
        
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

  // Get Single Location
  server.registerTool(
    "get_location",
    {
      description: "Fetch a specific location by ID",
      inputSchema: {
        id: z.string().describe("Location ID (e.g., 'gid://shopify/Location/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetLocation($id: ID!) {
          location(id: $id) {
            id
            name
            address {
              address1
              address2
              city
              province
              country
              zip
              phone
            }
            isActive
            isPrimary
            fulfillsOnlineOrders
            createdAt
            updatedAt
            inventoryLevels(first: 20) {
              edges {
                node {
                  id
                  available
                  item {
                    id
                    sku
                    variant {
                      id
                      title
                      product {
                        id
                        title
                      }
                    }
                  }
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

  // Create Location
  server.registerTool(
    "create_location",
    {
      description: "Create a new location",
      inputSchema: {
        name: z.string().describe("Location name"),
        address1: z.string().describe("Street address"),
        address2: z.string().optional().describe("Apartment, suite, etc."),
        city: z.string().describe("City"),
        province: z.string().describe("Province/State"),
        country: z.string().describe("Country"),
        zip: z.string().describe("ZIP/Postal code"),
        phone: z.string().optional().describe("Phone number"),
        fulfillsOnlineOrders: z.boolean().optional().describe("Whether location fulfills online orders"),
      },
    },
    async ({ name, address1, address2, city, province, country, zip, phone, fulfillsOnlineOrders = true }) => {
      const mutation = `
        mutation LocationCreate($input: LocationCreateInput!) {
          locationCreate(input: $input) {
            location {
              id
              name
              address {
                address1
                address2
                city
                province
                country
                zip
                phone
              }
              isActive
              fulfillsOnlineOrders
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const address: Record<string, string> = {
        address1,
        city,
        province,
        country,
        zip,
      };
      
      if (address2) address.address2 = address2;
      if (phone) address.phone = phone;

      const input = {
        name,
        address,
        fulfillsOnlineOrders,
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

  // Update Location
  server.registerTool(
    "update_location",
    {
      description: "Update an existing location",
      inputSchema: {
        id: z.string().describe("Location ID"),
        name: z.string().optional().describe("Location name"),
        address1: z.string().optional().describe("Street address"),
        address2: z.string().optional().describe("Apartment, suite, etc."),
        city: z.string().optional().describe("City"),
        province: z.string().optional().describe("Province/State"),
        country: z.string().optional().describe("Country"),
        zip: z.string().optional().describe("ZIP/Postal code"),
        phone: z.string().optional().describe("Phone number"),
        fulfillsOnlineOrders: z.boolean().optional().describe("Whether location fulfills online orders"),
        isActive: z.boolean().optional().describe("Whether location is active"),
      },
    },
    async ({ id, name, address1, address2, city, province, country, zip, phone, fulfillsOnlineOrders, isActive }) => {
      const mutation = `
        mutation LocationEdit($id: ID!, $input: LocationEditInput!) {
          locationEdit(id: $id, input: $input) {
            location {
              id
              name
              address {
                address1
                address2
                city
                province
                country
                zip
                phone
              }
              isActive
              fulfillsOnlineOrders
              updatedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = {};
      if (name) input.name = name;
      if (fulfillsOnlineOrders !== undefined) input.fulfillsOnlineOrders = fulfillsOnlineOrders;
      if (isActive !== undefined) input.isActive = isActive;
      
      const address: Record<string, string> = {};
      if (address1) address.address1 = address1;
      if (address2) address.address2 = address2;
      if (city) address.city = city;
      if (province) address.province = province;
      if (country) address.country = country;
      if (zip) address.zip = zip;
      if (phone) address.phone = phone;
      
      if (Object.keys(address).length > 0) {
        input.address = address;
      }

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
}
