import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

// Types for menu items
interface MenuItem {
  id: string;
  title: string;
  url?: string;
  type?: string;
  resourceId?: string;
  tags?: string[];
  items?: MenuItem[];
}

interface Menu {
  id: string;
  title: string;
  handle: string;
  isDefault: boolean;
  items: MenuItem[];
}

// Helper function to recursively find a menu item by ID
function findMenuItem(items: MenuItem[], targetId: string): MenuItem | null {
  for (const item of items) {
    if (item.id === targetId) {
      return item;
    }
    if (item.items && item.items.length > 0) {
      const found = findMenuItem(item.items, targetId);
      if (found) return found;
    }
  }
  return null;
}

// Helper function to convert MenuItem to MenuItemUpdateInput format
function convertToUpdateInput(item: MenuItem): Record<string, unknown> {
  const input: Record<string, unknown> = {
    id: item.id,
    title: item.title,
  };
  if (item.url) input.url = item.url;
  if (item.type) input.type = item.type;
  if (item.resourceId) input.resourceId = item.resourceId;
  if (item.tags) input.tags = item.tags;
  if (item.items && item.items.length > 0) {
    input.items = item.items.map(convertToUpdateInput);
  }
  return input;
}

export function registerNavigationTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Menus
  server.registerTool(
    "get_menus",
    {
      description: "Fetch navigation menus for the online store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of menus to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetMenus($first: Int!, $after: String) {
          menus(first: $first, after: $after) {
            edges {
              node {
                id
                title
                handle
                isDefault
                items(limit: 100) {
                  id
                  title
                  url
                  type
                  resourceId
                  tags
                  items {
                    id
                    title
                    url
                    type
                    resourceId
                    items {
                      id
                      title
                      url
                      type
                      resourceId
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

  // Get Menu
  server.registerTool(
    "get_menu",
    {
      description: "Fetch a specific menu by ID",
      inputSchema: {
        id: z.string().describe("Menu ID (e.g., 'gid://shopify/Menu/123456789')"),
      },
    },
    async ({ id }) => {
      const query = `
        query GetMenu($id: ID!) {
          menu(id: $id) {
            id
            title
            handle
            isDefault
            items(limit: 200) {
              id
              title
              url
              type
              resourceId
              tags
              items {
                id
                title
                url
                type
                resourceId
                items {
                  id
                  title
                  url
                  type
                  resourceId
                }
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(query, { id });
        
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

  // Get Menu Item
  server.registerTool(
    "get_menu_item",
    {
      description: "Fetch a specific menu item by ID from a menu",
      inputSchema: {
        menuId: z.string().describe("Menu ID (e.g., 'gid://shopify/Menu/123456789')"),
        menuItemId: z.string().describe("Menu item ID (e.g., 'gid://shopify/MenuItem/987654321')"),
      },
    },
    async ({ menuId, menuItemId }) => {
      const query = `
        query GetMenu($id: ID!) {
          menu(id: $id) {
            id
            title
            handle
            items(limit: 200) {
              id
              title
              url
              type
              resourceId
              tags
              items {
                id
                title
                url
                type
                resourceId
                items {
                  id
                  title
                  url
                  type
                  resourceId
                }
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute<{ menu: Menu }>(query, { id: menuId });
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        const menu = result.data?.menu;
        if (!menu) {
          return {
            content: [{ type: "text", text: `Menu not found: ${menuId}` }],
          };
        }

        const menuItem = findMenuItem(menu.items, menuItemId);
        if (!menuItem) {
          return {
            content: [{ type: "text", text: `Menu item not found: ${menuItemId}` }],
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify({ menuItem }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // Update Menu Item Children
  server.registerTool(
    "update_menu_item_children",
    {
      description: "Update only the children of a specific menu item. This is useful for updating a submenu without needing to reconstruct the entire menu structure.",
      inputSchema: {
        menuId: z.string().describe("Menu ID (e.g., 'gid://shopify/Menu/123456789')"),
        menuItemId: z.string().describe("Menu item ID whose children will be updated (e.g., 'gid://shopify/MenuItem/987654321')"),
        children: z.array(z.object({
          title: z.string().describe("Item title"),
          url: z.string().optional().describe("Item URL"),
          type: z.string().optional().describe("Item type (e.g., 'PAGE', 'PRODUCT', 'COLLECTION', 'BLOG', 'HTTP')"),
          items: z.array(z.object({
            title: z.string().describe("Nested item title"),
            url: z.string().optional().describe("Nested item URL"),
            type: z.string().optional().describe("Nested item type"),
          })).optional().describe("Nested items (3rd level)"),
        })).describe("New children to replace existing children of the specified menu item"),
      },
    },
    async ({ menuId, menuItemId, children }) => {
      // Step 1: Fetch the full menu
      const getMenuQuery = `
        query GetMenu($id: ID!) {
          menu(id: $id) {
            id
            title
            handle
            isDefault
            items(limit: 200) {
              id
              title
              url
              type
              resourceId
              tags
              items {
                id
                title
                url
                type
                resourceId
                tags
                items {
                  id
                  title
                  url
                  type
                  resourceId
                  tags
                }
              }
            }
          }
        }
      `;

      let menu: Menu;
      try {
        const result = await client.execute<{ menu: Menu }>(getMenuQuery, { id: menuId });
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors fetching menu: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        if (!result.data?.menu) {
          return {
            content: [{ type: "text", text: `Menu not found: ${menuId}` }],
          };
        }

        menu = result.data.menu;
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching menu: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }

      // Step 2: Find and update the target menu item
      const targetItem = findMenuItem(menu.items, menuItemId);
      if (!targetItem) {
        return {
          content: [{ type: "text", text: `Menu item not found: ${menuItemId}` }],
        };
      }

      // Replace the children
      targetItem.items = children.map(child => ({
        id: '', // New items won't have IDs yet
        title: child.title,
        url: child.url,
        type: child.type,
        items: child.items?.map(nestedChild => ({
          id: '',
          title: nestedChild.title,
          url: nestedChild.url,
          type: nestedChild.type,
        })) || [],
      }));

      // Step 3: Convert all items to update input format
      const itemsInput = menu.items.map(convertToUpdateInput);

      // Step 4: Update the menu
      const updateMutation = `
        mutation MenuUpdate($id: ID!, $title: String!, $items: [MenuItemUpdateInput!]!) {
          menuUpdate(id: $id, title: $title, items: $items) {
            menu {
              id
              title
              handle
              items(limit: 100) {
                id
                title
                url
                items {
                  id
                  title
                  url
                  items {
                    id
                    title
                    url
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

      try {
        const result = await client.execute(updateMutation, { 
          id: menuId, 
          title: menu.title, 
          items: itemsInput 
        });
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors updating menu: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        const responseData = result.data as { menuUpdate?: { menu?: Menu; userErrors?: unknown[] } };
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({ 
              success: true,
              message: `Updated children of menu item: ${targetItem.title}`,
              menu: responseData?.menuUpdate?.menu,
              userErrors: responseData?.menuUpdate?.userErrors,
            }, null, 2) 
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error updating menu: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // Create Menu
  server.registerTool(
    "create_menu",
    {
      description: "Create a new navigation menu",
      inputSchema: {
        title: z.string().describe("Menu title"),
        handle: z.string().describe("Unique handle (e.g., 'main-menu')"),
        items: z.array(z.object({
          title: z.string().describe("Item title"),
          url: z.string().optional().describe("Item URL"),
          type: z.string().optional().describe("Item type (e.g., 'PAGE', 'PRODUCT', 'COLLECTION', 'BLOG', 'HTTP')"),
        })).optional().describe("Menu items"),
      },
    },
    async ({ title, handle, items }) => {
      const mutation = `
        mutation MenuCreate($title: String!, $handle: String!, $items: [MenuItemCreateInput!]) {
          menuCreate(title: $title, handle: $handle, items: $items) {
            menu {
              id
              title
              handle
              isDefault
              items(limit: 100) {
                id
                title
                url
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
        const result = await client.execute(mutation, { title, handle, items });
        
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

  // Update Menu
  server.registerTool(
    "update_menu",
    {
      description: "Update an existing navigation menu. Requires passing the entire menu structure including all items and their IDs. Consider using update_menu_item_children for simpler partial updates.",
      inputSchema: {
        id: z.string().describe("Menu ID"),
        title: z.string().describe("Menu title"),
        items: z.array(z.object({
          id: z.string().optional().describe("Item ID (required for existing items, omit for new items)"),
          title: z.string().describe("Item title"),
          url: z.string().optional().describe("Item URL"),
          type: z.string().optional().describe("Item type"),
          items: z.array(z.object({
            id: z.string().optional().describe("Nested item ID"),
            title: z.string().describe("Nested item title"),
            url: z.string().optional().describe("Nested item URL"),
            type: z.string().optional().describe("Nested item type"),
            items: z.array(z.object({
              title: z.string().describe("3rd level item title"),
              url: z.string().optional().describe("3rd level item URL"),
              type: z.string().optional().describe("3rd level item type"),
            })).optional().describe("3rd level nested items"),
          })).optional().describe("Nested items (2nd level)"),
        })).optional().describe("Complete menu items structure (all levels)"),
      },
    },
    async ({ id, title, items }) => {
      const mutation = `
        mutation MenuUpdate($id: ID!, $title: String!, $items: [MenuItemUpdateInput!]) {
          menuUpdate(id: $id, title: $title, items: $items) {
            menu {
              id
              title
              handle
              items(limit: 100) {
                id
                title
                url
                items {
                  id
                  title
                  url
                  items {
                    id
                    title
                    url
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

      try {
        const result = await client.execute(mutation, { id, title, items });
        
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

  // Delete Menu
  server.registerTool(
    "delete_menu",
    {
      description: "Delete a navigation menu",
      inputSchema: {
        id: z.string().describe("Menu ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation MenuDelete($id: ID!) {
          menuDelete(id: $id) {
            deletedMenuId
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
