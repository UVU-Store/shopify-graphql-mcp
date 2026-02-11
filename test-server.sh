#!/bin/bash

# Test script for Shopify GraphQL MCP Server
# Usage: ./test-server.sh

echo "==================================="
echo "Shopify GraphQL MCP Server Test"
echo "==================================="
echo ""

# Check if required environment variables are set
if [ -z "$SHOPIFY_ACCESS_TOKEN" ]; then
    echo "Error: SHOPIFY_ACCESS_TOKEN is not set"
    echo "Please set the required environment variables:"
    echo "  export SHOPIFY_ACCESS_TOKEN=shpat_xxxxx"
    echo "  export SHOPIFY_STORE_URL=your-store.myshopify.com"
    echo "  export SHOPIFY_STORE_API_URL=https://your-store.myshopify.com/admin/api/2025-01/graphql.json"
    exit 1
fi

if [ -z "$SHOPIFY_STORE_URL" ]; then
    echo "Error: SHOPIFY_STORE_URL is not set"
    exit 1
fi

if [ -z "$SHOPIFY_STORE_API_URL" ]; then
    echo "Error: SHOPIFY_STORE_API_URL is not set"
    exit 1
fi

echo "Environment variables:"
echo "  SHOPIFY_STORE_URL: $SHOPIFY_STORE_URL"
echo "  SHOPIFY_STORE_API_URL: $SHOPIFY_STORE_API_URL"
echo "  SHOPIFY_ACCESS_TOKEN: ${SHOPIFY_ACCESS_TOKEN:0:10}..."
echo ""

# Test cURL availability
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed"
    exit 1
fi

echo "cURL: OK"
echo ""

# Test GraphQL connection
echo "Testing GraphQL API connection..."
RESPONSE=$(curl -s -X POST "$SHOPIFY_STORE_API_URL" \
    -H "Content-Type: application/json" \
    -H "X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN" \
    -d '{"query": "{ shop { name } }"}')

if echo "$RESPONSE" | grep -q "errors"; then
    echo "Error: API connection failed"
    echo "Response: $RESPONSE"
    exit 1
fi

if echo "$RESPONSE" | grep -q "shop"; then
    SHOP_NAME=$(echo "$RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    echo "Connection successful!"
    echo "Connected to shop: $SHOP_NAME"
else
    echo "Warning: Unexpected response format"
    echo "Response: $RESPONSE"
fi

echo ""
echo "==================================="
echo "All tests passed!"
echo "==================================="
echo ""
echo "You can now use the MCP server with your client."
echo "Example configuration for Claude Desktop:"
echo ""
cat <<'EOF'
{
  "mcpServers": {
    "shopify-graphql": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/shopify-graphql-mcp/dist/index.js"],
      "env": {
        "SHOPIFY_ACCESS_TOKEN": "YOUR_TOKEN",
        "SHOPIFY_STORE_URL": "YOUR_STORE",
        "SHOPIFY_STORE_API_URL": "YOUR_API_URL"
      }
    }
  }
}
EOF
