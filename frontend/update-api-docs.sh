#!/bin/bash

# Helper script to wrap JSON responses in {data, error} format
# This will be used to update API documentation files

echo "This script helps identify JSON code blocks in markdown files"
echo "Run manually to update API documentation response examples"
echo ""
echo "Pattern to find: Success responses need wrapping with:"
echo '{ "data": <original_response>, "error": null }'
echo ""
echo "Error responses need:"
echo '{ "data": null, "error": { "code": "...", "messageKey": "...", "message": "...", "details": {} } }'
