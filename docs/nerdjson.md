{
  "schema_version": "2.0.0",
  "architecture": "event_sourced_pos",
  
  "module_sales": {
    "sales_orders": {
      "description": "Master transaction header with ZATCA compliance",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "order_number", "type": "string", "unique": true, "note": "ORD-20250101-0001" },
        { "name": "public_ref", "type": "string", "note": "Short kitchen code: K-102" },
        { "name": "invoice_counter", "type": "integer", "note": "Sequential per register session for ZATCA" },
        
        { "name": "register_session_id", "type": "uuid", "fk": "register_sessions.id", "indexed": true },
        { "name": "device_id", "type": "uuid", "fk": "devices.id", "note": "Which tablet/terminal" },
        { "name": "customer_id", "type": "uuid", "fk": "customers.id", "nullable": true },
        { "name": "table_id", "type": "uuid", "fk": "tables.id", "nullable": true },
        { "name": "served_by_user_id", "type": "uuid", "fk": "users.id", "note": "Waiter/Cashier" },
        
        { "name": "order_type", "type": "enum", "values": ["DINE_IN", "TAKEAWAY", "DELIVERY", "DRIVE_THRU"] },
        { "name": "order_status", "type": "enum", "values": ["DRAFT", "KITCHEN", "READY", "COMPLETED", "VOID", "REFUNDED"] },
        { "name": "payment_status", "type": "enum", "values": ["UNPAID", "PARTIAL", "PAID", "REFUNDED"] },
        
        { "name": "subtotal", "type": "decimal(10,3)", "note": "Before tax/discounts" },
        { "name": "discount_amount", "type": "decimal(10,3)", "default": 0 },
        { "name": "discount_reason", "type": "string", "nullable": true },
        { "name": "total_tax", "type": "decimal(10,3)" },
        { "name": "total_gross", "type": "decimal(10,3)", "note": "Final amount to pay" },
        
        { "name": "is_simplified_invoice", "type": "boolean", "default": true, "note": "B2C vs B2B" },
        { "name": "zatca_xml_uuid", "type": "uuid", "unique": true, "note": "Unique invoice identifier" },
        { "name": "zatca_invoice_hash", "type": "string", "note": "SHA256 of invoice XML" },
        { "name": "zatca_previous_hash", "type": "string", "note": "Cryptographic chain" },
        { "name": "zatca_qr_code", "type": "text", "note": "TLV-encoded Base64 QR" },
        { "name": "zatca_signature", "type": "text", "nullable": true },
        { "name": "zatca_submission_status", "type": "enum", "values": ["PENDING", "SUBMITTED", "APPROVED", "REJECTED"], "default": "PENDING" },
        { "name": "zatca_submission_response", "type": "json", "nullable": true },
        
        { "name": "notes", "type": "text", "nullable": true },
        { "name": "created_at", "type": "datetime", "indexed": true },
        { "name": "updated_at", "type": "datetime" },
        { "name": "completed_at", "type": "datetime", "nullable": true },
        { "name": "voided_at", "type": "datetime", "nullable": true },
        { "name": "voided_by_user_id", "type": "uuid", "fk": "users.id", "nullable": true },
        { "name": "void_reason", "type": "string", "nullable": true }
      ],
      "indexes": [
        "idx_created_at",
        "idx_register_session",
        "idx_customer_id",
        "idx_order_status"
      ]
    },
    
    "order_items": {
      "description": "Line items with modifier snapshots",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "order_id", "type": "uuid", "fk": "sales_orders.id", "on_delete": "CASCADE" },
        { "name": "line_number", "type": "integer", "note": "Display sequence" },
        
        { "name": "product_id", "type": "uuid", "fk": "products.id" },
        { "name": "product_name", "type": "string", "note": "Snapshot at sale time" },
        { "name": "sku", "type": "string", "note": "Snapshot" },
        
        { "name": "quantity", "type": "decimal(10,3)" },
        { "name": "unit_price", "type": "decimal(10,3)", "note": "Base price before modifiers" },
        { "name": "modifiers_total", "type": "decimal(10,3)", "default": 0 },
        { "name": "line_discount", "type": "decimal(10,3)", "default": 0 },
        { "name": "line_subtotal", "type": "decimal(10,3)", "note": "(unit_price + modifiers) * qty - discount" },
        { "name": "tax_rate", "type": "decimal(5,2)", "note": "15.00 for Saudi VAT" },
        { "name": "tax_amount", "type": "decimal(10,3)" },
        { "name": "line_total", "type": "decimal(10,3)" },
        
        { "name": "cost_at_sale", "type": "decimal(10,3)", "note": "FIFO cost for margin" },
        { "name": "selected_modifiers", "type": "json", "note": "[{modifier_id, option_id, price}]" },
        { "name": "special_instructions", "type": "text", "nullable": true },
        
        { "name": "is_voided", "type": "boolean", "default": false },
        { "name": "voided_quantity", "type": "decimal(10,3)", "default": 0 }
      ]
    },
    
    "order_taxes": {
      "description": "Multi-rate tax breakdown per order",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "order_id", "type": "uuid", "fk": "sales_orders.id", "on_delete": "CASCADE" },
        { "name": "tax_name", "type": "string", "note": "VAT 15%" },
        { "name": "tax_rate", "type": "decimal(5,2)" },
        { "name": "taxable_amount", "type": "decimal(10,3)" },
        { "name": "tax_amount", "type": "decimal(10,3)" },
        { "name": "is_inclusive", "type": "boolean", "default": true }
      ]
    },
    
    "payments": {
      "description": "Payment transactions (supports split payments)",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "order_id", "type": "uuid", "fk": "sales_orders.id" },
        { "name": "register_session_id", "type": "uuid", "fk": "register_sessions.id" },
        
        { "name": "payment_method", "type": "enum", "values": ["CASH", "CARD", "BANK_TRANSFER", "MOBILE_WALLET", "CREDIT_ACCOUNT", "LOYALTY_POINTS"] },
        { "name": "amount", "type": "decimal(10,3)" },
        { "name": "received_amount", "type": "decimal(10,3)", "note": "Cash received (for change calc)" },
        { "name": "change_given", "type": "decimal(10,3)", "default": 0 },
        
        { "name": "card_last_4", "type": "string", "nullable": true },
        { "name": "card_type", "type": "string", "nullable": true, "note": "Visa, Mada" },
        { "name": "transaction_ref", "type": "string", "nullable": true, "note": "Bank reference" },
        
        { "name": "status", "type": "enum", "values": ["PENDING", "COMPLETED", "FAILED", "REFUNDED"] },
        { "name": "created_at", "type": "datetime" },
        { "name": "processed_by_user_id", "type": "uuid", "fk": "users.id" }
      ]
    },
    
    "refunds": {
      "description": "Refund transactions linked to original payments",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "original_order_id", "type": "uuid", "fk": "sales_orders.id" },
        { "name": "original_payment_id", "type": "uuid", "fk": "payments.id" },
        { "name": "refund_order_id", "type": "uuid", "fk": "sales_orders.id", "note": "New negative order" },
        
        { "name": "refund_amount", "type": "decimal(10,3)" },
        { "name": "refund_reason", "type": "string" },
        { "name": "refund_method", "type": "enum", "values": ["CASH", "CARD_REVERSAL", "CREDIT_NOTE"] },
        
        { "name": "authorized_by_user_id", "type": "uuid", "fk": "users.id", "note": "Manager approval" },
        { "name": "created_at", "type": "datetime" }
      ]
    }
  },
  
  "module_kitchen": {
    "kitchen_tickets": {
      "description": "Separate ticket lifecycle from order",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "ticket_number", "type": "string", "unique": true, "note": "K-261526" },
        { "name": "order_id", "type": "uuid", "fk": "sales_orders.id" },
        { "name": "order_item_id", "type": "uuid", "fk": "order_items.id" },
        
        { "name": "station_id", "type": "uuid", "fk": "kitchen_stations.id", "note": "Grill, Salad, Drinks" },
        { "name": "printer_id", "type": "uuid", "fk": "printers.id", "nullable": true },
        
        { "name": "product_name", "type": "string" },
        { "name": "quantity", "type": "decimal(10,3)" },
        { "name": "modifiers_text", "type": "text", "note": "Readable version for kitchen" },
        { "name": "special_instructions", "type": "text", "nullable": true },
        
        { "name": "status", "type": "enum", "values": ["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"] },
        { "name": "priority", "type": "integer", "default": 0, "note": "Higher = urgent" },
        
        { "name": "sent_to_kitchen_at", "type": "datetime" },
        { "name": "started_at", "type": "datetime", "nullable": true },
        { "name": "completed_at", "type": "datetime", "nullable": true },
        { "name": "preparation_time_seconds", "type": "integer", "nullable": true }
      ]
    },
    
    "kitchen_stations": {
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "name", "type": "string", "note": "Grill, Salad Bar" },
        { "name": "is_active", "type": "boolean", "default": true }
      ]
    }
  },
  
  "module_products": {
    "products": {
      "description": "Unified product catalog",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "sku", "type": "string", "unique": true },
        { "name": "barcode", "type": "string", "unique": true, "nullable": true },
        { "name": "name", "type": "string" },
        { "name": "name_ar", "type": "string", "nullable": true, "note": "Arabic for receipts" },
        { "name": "description", "type": "text", "nullable": true },
        
        { "name": "category_id", "type": "uuid", "fk": "product_categories.id" },
        { "name": "type", "type": "enum", "values": ["PRODUCT", "INGREDIENT", "SERVICE", "COMBO"] },
        
        { "name": "sale_price", "type": "decimal(10,3)" },
        { "name": "cost_price", "type": "decimal(10,3)", "note": "Average cost" },
        { "name": "tax_rate", "type": "decimal(5,2)", "default": 15.00 },
        { "name": "is_tax_inclusive", "type": "boolean", "default": true },
        { "name": "is_tax_exempt", "type": "boolean", "default": false },
        { "name": "tax_exempt_reason", "type": "string", "nullable": true },
        
        { "name": "is_stock_managed", "type": "boolean", "default": true },
        { "name": "unit_of_measure", "type": "string", "note": "pcs, kg, liter" },
        { "name": "kitchen_station_id", "type": "uuid", "fk": "kitchen_stations.id", "nullable": true },
        
        { "name": "image_url", "type": "string", "nullable": true },
        { "name": "display_order", "type": "integer", "default": 0 },
        { "name": "is_active", "type": "boolean", "default": true },
        { "name": "is_featured", "type": "boolean", "default": false },
        
        { "name": "created_at", "type": "datetime" },
        { "name": "updated_at", "type": "datetime" }
      ]
    },
    
    "product_categories": {
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "name", "type": "string" },
        { "name": "name_ar", "type": "string", "nullable": true },
        { "name": "parent_id", "type": "uuid", "fk": "product_categories.id", "nullable": true },
        { "name": "display_order", "type": "integer" },
        { "name": "color_hex", "type": "string", "note": "UI color coding" }
      ]
    },
    
    "modifiers": {
      "description": "Modifier groups (e.g., Size, Toppings)",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "name", "type": "string", "note": "Size, Add-ons" },
        { "name": "name_ar", "type": "string", "nullable": true },
        { "name": "min_selection", "type": "integer", "default": 0 },
        { "name": "max_selection", "type": "integer", "default": 1 },
        { "name": "is_required", "type": "boolean", "default": false },
        { "name": "display_order", "type": "integer" }
      ]
    },
    
    "modifier_options": {
      "description": "Individual choices within a modifier group",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "modifier_id", "type": "uuid", "fk": "modifiers.id" },
        { "name": "name", "type": "string", "note": "Small, Large, Extra Cheese" },
        { "name": "name_ar", "type": "string", "nullable": true },
        { "name": "price_adjustment", "type": "decimal(10,3)", "default": 0, "note": "+5.00 for Extra Cheese" },
        { "name": "price_type", "type": "enum", "values": ["FIXED", "PERCENTAGE"], "default": "FIXED" },
        { "name": "is_default", "type": "boolean", "default": false },
        { "name": "display_order", "type": "integer" }
      ]
    },
    
    "product_modifiers": {
      "description": "Links products to their available modifier groups",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "product_id", "type": "uuid", "fk": "products.id" },
        { "name": "modifier_id", "type": "uuid", "fk": "modifiers.id" },
        { "name": "display_order", "type": "integer" }
      ]
    }
  },
  
  "module_inventory": {
    "recipes": {
      "description": "BOM: Finished product -> Raw ingredients",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "product_id", "type": "uuid", "fk": "products.id", "note": "Burger" },
        { "name": "ingredient_id", "type": "uuid", "fk": "products.id", "note": "Beef Patty" },
        { "name": "quantity_required", "type": "decimal(10,3)", "note": "0.2 kg per burger" }
      ]
    },
    
    "inventory_batches": {
      "description": "FIFO cost tracking per batch",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "product_id", "type": "uuid", "fk": "products.id" },
        { "name": "warehouse_id", "type": "uuid", "fk": "warehouses.id" },
        { "name": "batch_code", "type": "string" },
        { "name": "supplier_id", "type": "uuid", "fk": "suppliers.id", "nullable": true },
        { "name": "purchase_order_id", "type": "uuid", "fk": "purchase_orders.id", "nullable": true },
        
        { "name": "expiry_date", "type": "date", "nullable": true },
        { "name": "cost_per_unit", "type": "decimal(10,3)" },
        { "name": "initial_quantity", "type": "decimal(10,3)" },
        
        { "name": "created_at", "type": "datetime" }
      ],
      "note": "qty_remaining is calculated from stock_moves, not stored"
    },
    
    "stock_moves": {
      "description": "Immutable ledger of all inventory transactions",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "created_at", "type": "datetime", "indexed": true },
        
        { "name": "product_id", "type": "uuid", "fk": "products.id", "indexed": true },
        { "name": "warehouse_id", "type": "uuid", "fk": "warehouses.id" },
        { "name": "batch_id", "type": "uuid", "fk": "inventory_batches.id", "nullable": true },
        
        { "name": "qty_change", "type": "decimal(10,3)", "note": "+100 in, -5 out" },
        { "name": "unit_cost", "type": "decimal(10,3)", "note": "Cost at this transaction" },
        
        { "name": "move_type", "type": "enum", "values": ["PURCHASE", "SALE", "WASTAGE", "ADJUSTMENT", "PRODUCTION", "TRANSFER", "RETURN"] },
        { "name": "ref_order_id", "type": "uuid", "fk": "sales_orders.id", "nullable": true },
        { "name": "ref_purchase_order_id", "type": "uuid", "fk": "purchase_orders.id", "nullable": true },
        { "name": "ref_transfer_id", "type": "uuid", "nullable": true },
        
        { "name": "reason", "type": "string", "nullable": true, "note": "Spillage, Expired" },
        { "name": "created_by_user_id", "type": "uuid", "fk": "users.id" }
      ]
    },
    
    "warehouses": {
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "name", "type": "string", "note": "Main Kitchen, Bar Storage" },
        { "name": "type", "type": "enum", "values": ["MAIN", "KITCHEN", "BAR", "RETAIL"] },
        { "name": "is_active", "type": "boolean", "default": true }
      ]
    },
    
    "purchase_orders": {
      "description": "How inventory enters the system",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "po_number", "type": "string", "unique": true },
        { "name": "supplier_id", "type": "uuid", "fk": "suppliers.id" },
        { "name": "warehouse_id", "type": "uuid", "fk": "warehouses.id" },
        
        { "name": "status", "type": "enum", "values": ["DRAFT", "SENT", "CONFIRMED", "RECEIVED", "CANCELLED"] },
        { "name": "total_amount", "type": "decimal(10,3)" },
        
        { "name": "ordered_at", "type": "datetime" },
        { "name": "expected_delivery_date", "type": "date", "nullable": true },
        { "name": "received_at", "type": "datetime", "nullable": true },
        { "name": "created_by_user_id", "type": "uuid", "fk": "users.id" }
      ]
    },
    
    "purchase_order_items": {
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "purchase_order_id", "type": "uuid", "fk": "purchase_orders.id" },
        { "name": "product_id", "type": "uuid", "fk": "products.id" },
        { "name": "quantity_ordered", "type": "decimal(10,3)" },
        { "name": "quantity_received", "type": "decimal(10,3)", "default": 0 },
        { "name": "unit_cost", "type": "decimal(10,3)" },
        { "name": "line_total", "type": "decimal(10,3)" }
      ]
    },
    
    "suppliers": {
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "name", "type": "string" },
        { "name": "contact_person", "type": "string", "nullable": true },
        { "name": "phone", "type": "string", "nullable": true },
        { "name": "email", "type": "string", "nullable": true },
        { "name": "tax_id", "type": "string", "nullable": true },
        { "name": "payment_terms", "type": "string", "nullable": true, "note": "Net 30" },
        { "name": "is_active", "type": "boolean", "default": true }
      ]
    },
    
    "stock_alerts": {
      "description": "Low stock notifications",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "product_id", "type": "uuid", "fk": "products.id" },
        { "name": "warehouse_id", "type": "uuid", "fk": "warehouses.id" },
        { "name": "min_quantity", "type": "decimal(10,3)" },
        { "name": "current_quantity", "type": "decimal(10,3)" },
        { "name": "alert_status", "type": "enum", "values": ["LOW", "CRITICAL", "OUT_OF_STOCK"] },
        { "name": "notified_at", "type": "datetime", "nullable": true }
      ]
    }
  },
  
  "module_cash_management": {
    "register_sessions": {
      "description": "Cashier shift with full audit trail",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "session_number", "type": "string", "unique": true },
        { "name": "device_id", "type": "uuid", "fk": "devices.id" },
        { "name": "user_id", "type": "uuid", "fk": "users.id" },
        
        { "name": "opened_at", "type": "datetime" },
        { "name": "closed_at", "type": "datetime", "nullable": true },
        { "name": "opening_cash", "type": "decimal(10,3)" },
        { "name": "closing_cash_expected", "type": "decimal(10,3)" },
        { "name": "closing_cash_actual", "type": "decimal(10,3)", "nullable": true },
        { "name": "cash_difference", "type": "decimal(10,3)", "nullable": true },
        
        { "name": "total_sales", "type": "decimal(10,3)", "default": 0 },
        { "name": "total_refunds", "type": "decimal(10,3)", "default": 0 },
        { "name": "total_cash_payments", "type": "decimal(10,3)", "default": 0 },
        { "name": "total_card_payments", "type": "decimal(10,3)", "default": 0 },
        
        { "name": "status", "type": "enum", "values": ["OPEN", "CLOSED", "DISCREPANCY_UNDER", "DISCREPANCY_OVER"] },
        { "name": "notes", "type": "text", "nullable": true }
      ]
    },
    
    "cash_transactions": {
      "description": "Petty cash movements (non-sales)",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "register_session_id", "type": "uuid", "fk": "register_sessions.id" },
        
        { "name": "transaction_type", "type": "enum", "values": ["PAY_IN", "PAY_OUT", "BANK_DROP", "FLOAT_ADJUSTMENT"] },
        { "name": "amount", "type": "decimal(10,3)", "note": "Negative for payout" },
        { "name": "reason", "type": "string", "note": "Buying ice, Vendor payment" },
        
        { "name": "authorized_by_user_id", "type": "uuid", "fk": "users.id", "nullable": true },
        { "name": "created_at", "type": "datetime" },
        { "name": "created_by_user_id", "type": "uuid", "fk": "users.id" }
      ]
    },
    
    "bank_drops": {
      "description": "Cash deposited to bank",
      "fields": [
        { "name": "id", "type": "uuid", "pk": true },
        { "name": "register_session_id", "type": "uuid", "fk": "register_sessions.id", "nullable": true },
        { "name": "amount", "type": "decimal(10,3)" },
        { "name": "deposit_date", "type": "date" },
        { "name": "bank_reference", "type": "string", "nullable": true },
        { "name": "deposited_by_user_id", "type": "uuid", "fk": "users.id" },
        { "name": "notes", "type": "text", "nullable": true }
      ]
    }
  },
  
  "module_tables": {
    "table_zones": {
      "fields": [
        {

{
  "nerdpos_mvp_v2": "Complete Production Schema - Zero Gaps",
  
  "SALES_CORE": {
    "sales_orders": "id, order_number, public_ref, invoice_counter, register_session_id*, device_id*, customer_id*, table_id*, served_by_user_id*, order_type[DINE_IN|TAKEAWAY|DELIVERY], order_status[DRAFT|KITCHEN|READY|COMPLETED|VOID|REFUNDED], payment_status[UNPAID|PARTIAL|PAID|REFUNDED], subtotal, discount_amount, discount_reason, total_tax, total_gross, is_simplified_invoice, zatca_xml_uuid!, zatca_invoice_hash, zatca_previous_hash, zatca_qr_code, zatca_signature, zatca_submission_status[PENDING|SUBMITTED|APPROVED|REJECTED], zatca_submission_response:json, notes, created_at@, completed_at, voided_at, voided_by_user_id*, void_reason",
    
    "order_items": "id, order_id*^CASCADE, line_number, product_id*, product_name$, sku$, quantity, unit_price, modifiers_total, line_discount, line_subtotal, tax_rate, tax_amount, line_total, cost_at_sale, selected_modifiers:json[{modifier_id,option_id,price}], special_instructions, is_voided, voided_quantity",
    
    "order_taxes": "id, order_id*^CASCADE, tax_name, tax_rate, taxable_amount, tax_amount, is_inclusive",
    
    "payments": "id, order_id*, register_session_id*, payment_method[CASH|CARD|BANK_TRANSFER|MOBILE_WALLET|CREDIT_ACCOUNT|LOYALTY], amount, received_amount, change_given, card_last_4, card_type, transaction_ref, status[PENDING|COMPLETED|FAILED|REFUNDED], created_at, processed_by_user_id*",
    
    "refunds": "id, original_order_id*, original_payment_id*, refund_order_id*, refund_amount, refund_reason!, refund_method[CASH|CARD_REVERSAL|CREDIT_NOTE], authorized_by_user_id*!, created_at"
  },
  
  "KITCHEN": {
    "kitchen_tickets": "id, ticket_number!, order_id*, order_item_id*, station_id*, printer_id*, product_name, quantity, modifiers_text, special_instructions, status[PENDING|PREPARING|READY|SERVED|CANCELLED], priority:int, sent_to_kitchen_at, started_at, completed_at, preparation_time_seconds",
    
    "kitchen_stations": "id, name, is_active",
    
    "printers": "id, name, ip_address, station_id*, type[RECEIPT|KITCHEN|BAR|LABEL]"
  },
  
  "PRODUCTS": {
    "products": "id, sku!, barcode!, name, name_ar, description, category_id*, type[PRODUCT|INGREDIENT|SERVICE|COMBO], sale_price, cost_price, tax_rate=15.00, is_tax_inclusive=true, is_tax_exempt, tax_exempt_reason, is_stock_managed, unit_of_measure, kitchen_station_id*, image_url, display_order, is_active, is_featured, created_at, updated_at",
    
    "product_categories": "id, name, name_ar, parent_id*self, display_order, color_hex",
    
    "modifiers": "id, name, name_ar, min_selection=0, max_selection=1, is_required, display_order",
    
    "modifier_options": "id, modifier_id*, name, name_ar, price_adjustment=0, price_type[FIXED|PERCENTAGE], is_default, display_order",
    
    "product_modifiers": "id, product_id*, modifier_id*, display_order",
    
    "combos": "id, product_id*, child_product_id*, quantity, is_optional",
    
    "product_variants": "id, product_id*, variant_name, sku!, price_adjustment, is_default"
  },
  
  "INVENTORY": {
    "recipes": "id, product_id*, ingredient_id*, quantity_required",
    
    "inventory_batches": "id, product_id*, warehouse_id*, batch_code, supplier_id*, purchase_order_id*, expiry_date, cost_per_unit, initial_quantity, created_at",
    
    "stock_moves": "id@, created_at@, product_id*@, warehouse_id*, batch_id*, qty_change, unit_cost, move_type[PURCHASE|SALE|WASTAGE|ADJUSTMENT|PRODUCTION|TRANSFER|RETURN], ref_order_id*, ref_purchase_order_id*, ref_transfer_id, reason, created_by_user_id*",
    
    "warehouses": "id, name, type[MAIN|KITCHEN|BAR|RETAIL], is_active",
    
    "purchase_orders": "id, po_number!, supplier_id*, warehouse_id*, status[DRAFT|SENT|CONFIRMED|RECEIVED|CANCELLED], total_amount, ordered_at, expected_delivery_date, received_at, created_by_user_id*",
    
    "purchase_order_items": "id, purchase_order_id*, product_id*, quantity_ordered, quantity_received, unit_cost, line_total",
    
    "suppliers": "id, name, contact_person, phone, email, tax_id, payment_terms, is_active",
    
    "stock_alerts": "id, product_id*, warehouse_id*, min_quantity, current_quantity, alert_status[LOW|CRITICAL|OUT_OF_STOCK], notified_at"
  },
  
  "CASH_REGISTER": {
    "register_sessions": "id, session_number!, device_id*, user_id*, opened_at, closed_at, opening_cash, closing_cash_expected, closing_cash_actual, cash_difference, total_sales, total_refunds, total_cash_payments, total_card_payments, status[OPEN|CLOSED|DISCREPANCY_UNDER|DISCREPANCY_OVER], notes",
    
    "cash_transactions": "id, register_session_id*, transaction_type[PAY_IN|PAY_OUT|BANK_DROP|FLOAT_ADJUSTMENT], amount, reason!, authorized_by_user_id*, created_at, created_by_user_id*",
    
    "bank_drops": "id, register_session_id*, amount, deposit_date, bank_reference, deposited_by_user_id*, notes"
  },
  
  "TABLES": {
    "table_zones": "id, name, name_ar, display_order, color_hex",
    
    "tables": "id, zone_id*, name, capacity, is_active, qr_code"
  },
  
  "CRM": {
    "customers": "id, customer_code!, phone!, email, name, name_ar, tax_id, address, credit_limit, credit_balance, loyalty_points, tier[REGULAR|SILVER|GOLD|VIP], is_active, created_at",
    
    "loyalty_transactions": "id, customer_id*, order_id*, points, transaction_type[EARNED|REDEEMED|EXPIRED|ADJUSTED], created_at",
    
    "customer_addresses": "id, customer_id*, address_type[BILLING|SHIPPING], street, city, postal_code, is_default"
  },
  
  "SYSTEM": {
    "users": "id, username!, email, password_hash, full_name, role_id*, is_active, pin_code, last_login, created_at",
    
    "roles": "id, name!, permissions:json, is_system_role",
    
    "devices": "id, device_name!, device_type[POS_TERMINAL|KITCHEN_DISPLAY|HANDHELD|KIOSK], mac_address, last_ip, is_active, last_seen",
    
    "audit_logs": "id@, created_at@, user_id*, action, entity_type, entity_id, old_values:json, new_values:json, ip_address, device_id*",
    
    "system_settings": "id, setting_key!, setting_value:json, category, updated_by_user_id*, updated_at"
  },
  
  "REPORTING_CACHE": {
    "daily_sales_summary": "id, business_date!, total_orders, total_gross, total_tax, total_discounts, avg_ticket_size, top_product_id*, top_category_id*, created_at",
    
    "shift_summaries": "id, register_session_id*!, user_id*, sales_count, refund_count, void_count, cash_collected, card_collected, avg_preparation_time, created_at"
  },
  
  "LEGEND": {
    "symbols": {
      "*": "Foreign Key",
      "!": "Unique Constraint",
      "@": "Indexed",
      "$": "Snapshot at transaction time",
      "^CASCADE": "ON DELETE CASCADE",
      "=value": "Default value",
      ":type": "Data type (json, int, etc.)",
      "[A|B]": "ENUM values"
    }
  },
  
  "CRITICAL_RELATIONSHIPS": [
    "sales_orders.register_session_id -> register_sessions.id (Audit Chain)",
    "order_items.product_id -> products.id (Inventory Trigger)",
    "stock_moves.batch_id -> inventory_batches.id (FIFO Costing)",
    "kitchen_tickets.station_id -> kitchen_stations.id (Routing)",
    "payments.order_id -> sales_orders.id (Payment Split Support)",
    "recipes.product_id + ingredient_id -> products.id (BOM Loop)",
    "refunds.authorized_by_user_id -> users.id (Manager Approval)"
  ],
  
  "BUSINESS_RULES": {
    "zatca_compliance": [
      "sales_orders.zatca_invoice_hash = SHA256(xml_content)",
      "sales_orders.zatca_previous_hash links to last invoice in register_session",
      "invoice_counter increments per register_session, resets daily",
      "zatca_qr_code contains TLV: seller_name|vat_number|timestamp|total|tax"
    ],
    "inventory_fifo": [
      "On sale: Deduct from inventory_batches WHERE product_id ORDER BY created_at ASC",
      "order_items.cost_at_sale = SUM(batch.cost_per_unit * qty_deducted)",
      "stock_moves records each batch deduction with batch_id"
    ],
    "cash_audit": [
      "register_sessions.closing_cash_expected = opening_cash + total_cash_payments - cash_transactions.PAY_OUT",
      "status = DISCREPANCY if |closing_cash_actual - closing_cash_expected| > tolerance",
      "All payments MUST link to register_session_id"
    ],
    "modifier_validation": [
      "IF modifiers.is_required THEN order_items.selected_modifiers.length >= min_selection",
      "selected_modifiers.length <= max_selection",
      "Exactly ONE option with is_default=true must exist if min_selection=1"
    ],
    "kitchen_workflow": [
      "kitchen_tickets generated on order_status = 'KITCHEN'",
      "preparation_time_seconds = completed_at - started_at",
      "Order status cannot be 'COMPLETED' until all tickets status='SERVED'"
    ]
  },
  
  "MISSING_FROM_ORIGINAL_SCHEMA": [
    "✅ Payment splitting (multiple payment records per order)",
    "✅ Refund authorization (manager approval)",
    "✅ Tax breakdown by rate (order_taxes table)",
    "✅ Modifier min/max validation fields",
    "✅ Kitchen station routing",
    "✅ Purchase orders & supplier management",
    "✅ Stock alerts for low inventory",
    "✅ Device tracking (which terminal made sale)",
    "✅ User roles & permissions",
    "✅ Audit logs for compliance",
    "✅ Printers configuration",
    "✅ Customer tiers & addresses",
    "✅ Product variants (size, color)",
    "✅ Combo products (meal deals)",
    "✅ Bank drops tracking",
    "✅ Daily sales cache for reporting",
    "✅ QR codes on tables",
    "✅ Invoice counter per session"
  ]
}