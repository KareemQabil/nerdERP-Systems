-- =============================================================================
-- nerdPOS (H-POS) Enterprise Enhancement Migration
-- =============================================================================
-- Version: 1.0.0
-- Date: 2025-12-31
-- Description: Adds support for modular calculation pipeline, state machine,
--              delivery management, printing engine, and return workflows
-- =============================================================================

-- =============================================================================
-- PART 1: NEW TABLES
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 Calculation Pipeline Configuration
-- ----------------------------------------------------------------------------
CREATE TABLE calculation_pipeline_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    version VARCHAR(50) NOT NULL,
    pipeline_id VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pipeline_store FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE INDEX idx_pipeline_store ON calculation_pipeline_configs(store_id);
CREATE INDEX idx_pipeline_active ON calculation_pipeline_configs(is_active) WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- 1.2 Order Discounts
-- ----------------------------------------------------------------------------
CREATE TABLE order_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    discount_type VARCHAR(50) NOT NULL,
    discount_method VARCHAR(50) NOT NULL,
    value DECIMAL(10,3) NOT NULL,
    amount DECIMAL(10,3) NOT NULL,
    requires_authorization BOOLEAN DEFAULT false,
    requested_by_user_id UUID,
    authorized_by_user_id UUID,
    authorized_at TIMESTAMP WITH TIME ZONE,
    discount_code VARCHAR(100),
    reason TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'APPLIED',
    rejection_reason TEXT,
    apply_to_tax BOOLEAN DEFAULT true,
    apply_to_service_charge BOOLEAN DEFAULT true,
    apply_to_delivery BOOLEAN DEFAULT true,
    device_id VARCHAR(255),
    ip_address VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_discount_order FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_discount_order ON order_discounts(order_id);
CREATE INDEX idx_discount_type ON order_discounts(discount_type);
CREATE INDEX idx_discount_status ON order_discounts(status);

-- ----------------------------------------------------------------------------
-- 1.3 Return Orders
-- ----------------------------------------------------------------------------
CREATE TABLE return_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_order_id UUID NOT NULL,
    original_order_number VARCHAR(255) NOT NULL,
    return_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'REQUESTED',
    returned_items JSONB NOT NULL,
    items_count INTEGER DEFAULT 0,
    return_reason VARCHAR(100) NOT NULL,
    details TEXT,
    customer_note TEXT,
    internal_notes TEXT,
    refund_amount DECIMAL(10,3) NOT NULL,
    refund_breakdown JSONB,
    restore_inventory BOOLEAN DEFAULT false,
    refund_method VARCHAR(100),
    requires_approval BOOLEAN DEFAULT true,
    requested_by_user_id UUID NOT NULL,
    requested_by_user_name VARCHAR(255) NOT NULL,
    approved_by_user_id UUID,
    approved_by_user_name VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by_user_id UUID,
    completed_at TIMESTAMP WITH TIME ZONE,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    store_id UUID NOT NULL,
    register_session_id UUID,
    device_id VARCHAR(255),
    ip_address VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_return_original_order FOREIGN KEY (original_order_id) REFERENCES sales_orders(id)
);

CREATE INDEX idx_return_original_order ON return_orders(original_order_id);
CREATE INDEX idx_return_status ON return_orders(status);
CREATE INDEX idx_return_store ON return_orders(store_id);
CREATE INDEX idx_return_date ON return_orders(created_at DESC);

-- ----------------------------------------------------------------------------
-- 1.4 Delivery Drivers
-- ----------------------------------------------------------------------------
CREATE TABLE delivery_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    driver_code VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    vehicle_type VARCHAR(50),
    vehicle_plate VARCHAR(50),
    vehicle_description TEXT,
    status VARCHAR(50) DEFAULT 'OFF_DUTY',
    status_since TIMESTAMP WITH TIME ZONE,
    current_location JSONB,
    last_known_location JSONB,
    assigned_zones JSONB,
    can_accept_outside_zones BOOLEAN DEFAULT true,
    max_concurrent_orders INTEGER DEFAULT 5,
    current_order_count INTEGER DEFAULT 0,
    metrics JSONB,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    payment_type VARCHAR(50),
    payment_rate DECIMAL(10,3),
    is_active BOOLEAN DEFAULT true,
    working_hours JSONB,
    shift_id UUID,
    notes TEXT,
    emergency_contact JSONB,
    metadata JSONB,
    hire_date TIMESTAMP WITH TIME ZONE,
    termination_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_driver_store FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE INDEX idx_driver_store ON delivery_drivers(store_id);
CREATE INDEX idx_driver_status ON delivery_drivers(status, is_active);
CREATE INDEX idx_driver_code ON delivery_drivers(driver_code);

-- ----------------------------------------------------------------------------
-- 1.5 Delivery Assignments
-- ----------------------------------------------------------------------------
CREATE TABLE delivery_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    order_id UUID NOT NULL,
    order_number VARCHAR(255) NOT NULL,
    zone_id UUID NOT NULL,
    zone_code VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'ASSIGNED',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    out_for_delivery_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    decline_reason VARCHAR(100),
    decline_notes TEXT,
    delivery_proof JSONB,
    delivered_to_person VARCHAR(255),
    delivery_notes TEXT,
    trip_data JSONB,
    start_location JSONB,
    destination_location JSONB,
    payment_collection JSONB,
    priority_level INTEGER DEFAULT 3,
    is_rush BOOLEAN DEFAULT false,
    store_id UUID NOT NULL,
    device_id VARCHAR(255),
    driver_notes TEXT,
    internal_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignment_driver FOREIGN KEY (driver_id) REFERENCES delivery_drivers(id)
);

CREATE INDEX idx_assignment_driver ON delivery_assignments(driver_id, status);
CREATE INDEX idx_assignment_order ON delivery_assignments(order_id);
CREATE INDEX idx_assignment_zone ON delivery_assignments(zone_id);
CREATE INDEX idx_assignment_status ON delivery_assignments(status);
CREATE INDEX idx_assignment_store ON delivery_assignments(store_id);

-- ----------------------------------------------------------------------------
-- 1.6 Print Templates
-- ----------------------------------------------------------------------------
CREATE TABLE print_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID,
    template_name VARCHAR(255) NOT NULL,
    template_code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL,
    paper_size VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    raw_template TEXT,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(50) DEFAULT '1.0',
    category VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    language VARCHAR(10) DEFAULT 'en',
    is_rtl BOOLEAN DEFAULT false,
    preview_image_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_template_store FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE INDEX idx_template_store ON print_templates(store_id);
CREATE INDEX idx_template_type ON print_templates(template_type);
CREATE INDEX idx_template_active ON print_templates(is_active) WHERE is_active = true;

-- =============================================================================
-- PART 2: ENHANCED EXISTING TABLES
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 Sales Orders Enhancements
-- ----------------------------------------------------------------------------

-- Calculation Pipeline Versioning
ALTER TABLE sales_orders
  ADD COLUMN pipeline_version VARCHAR(50),
  ADD COLUMN pipeline_id VARCHAR(255);

-- Delivery Management Fields
ALTER TABLE sales_orders
  ADD COLUMN delivery_zone_id UUID,
  ADD COLUMN delivery_address JSONB,
  ADD COLUMN delivery_fee DECIMAL(10,3),
  ADD COLUMN driver_id UUID,
  ADD COLUMN delivery_status VARCHAR(50),
  ADD COLUMN driver_assigned_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN order_picked_up_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN out_for_delivery_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN delivery_notes TEXT,
  ADD COLUMN delivery_contact JSONB;

-- Table Splitting & Return Order Linkage
ALTER TABLE sales_orders
  ADD COLUMN parent_order_id UUID,
  ADD COLUMN original_order_id UUID,
  ADD COLUMN seat_assignments JSONB;

-- Add indexes for new fields
CREATE INDEX idx_sales_delivery_zone ON sales_orders(delivery_zone_id);
CREATE INDEX idx_sales_driver ON sales_orders(driver_id);
CREATE INDEX idx_sales_delivery_status ON sales_orders(delivery_status);
CREATE INDEX idx_sales_parent_order ON sales_orders(parent_order_id);
CREATE INDEX idx_sales_original_order ON sales_orders(original_order_id);

-- ----------------------------------------------------------------------------
-- 2.2 Order State History Enhancements
-- ----------------------------------------------------------------------------

-- Change from_state type to match OrderStatus enum
ALTER TABLE order_state_history
  ALTER COLUMN from_state TYPE VARCHAR(50);

-- Change to_state type to match OrderStatus enum
ALTER TABLE order_state_history
  ALTER COLUMN to_state TYPE VARCHAR(50);

-- Add new columns for enhanced workflow tracking
ALTER TABLE order_state_history
  ADD COLUMN order_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  ADD COLUMN transition_type VARCHAR(50) DEFAULT 'MANUAL',
  ADD COLUMN initiated_by_user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  ADD COLUMN initiated_by_user_name VARCHAR(255) NOT NULL,
  ADD COLUMN approved_by_user_id UUID,
  ADD COLUMN approved_by_user_name VARCHAR(255),
  ADD COLUMN requires_approval BOOLEAN DEFAULT false,
  ADD COLUMN approval_status VARCHAR(50),
  ADD COLUMN approval_requested_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN approval_responded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN rejection_reason TEXT,
  ADD COLUMN transition_reason TEXT,
  ADD COLUMN customer_facing_note TEXT,
  ADD COLUMN side_effects JSONB,
  ADD COLUMN financial_snapshot JSONB,
  ADD COLUMN payment_data JSONB,
  ADD COLUMN void_reason TEXT,
  ADD COLUMN return_reason TEXT,
  ADD COLUMN returned_items JSONB,
  ADD COLUMN aggregator_order_id VARCHAR(255),
  ADD COLUMN aggregator_status VARCHAR(255),
  ADD COLUMN device_id VARCHAR(255),
  ADD COLUMN ip_address VARCHAR(100),
  ADD COLUMN location_data JSONB,
  ADD COLUMN original_order_id UUID,
  ADD COLUMN return_order_id UUID;

-- Add foreign key constraint for order_id
ALTER TABLE order_state_history
  ADD CONSTRAINT fk_state_history_order FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE;

-- Create indexes for new columns
CREATE INDEX idx_state_history_order ON order_state_history(order_id);
CREATE INDEX idx_state_history_to_state ON order_state_history(to_state);
CREATE INDEX idx_state_history_approval ON order_state_history(approval_status) WHERE approval_status IS NOT NULL;
CREATE INDEX idx_state_history_timestamp ON order_state_history(transition_timestamp DESC);

-- ----------------------------------------------------------------------------
-- 2.3 Print Job Enhancements
-- ----------------------------------------------------------------------------

-- Add priority queue fields
ALTER TABLE print_jobs
  ADD COLUMN priority_level INTEGER DEFAULT 3,
  ADD COLUMN priority_name VARCHAR(50) DEFAULT 'NORMAL';

-- Add station routing fields
ALTER TABLE print_jobs
  ADD COLUMN station_id UUID,
  ADD COLUMN station_code VARCHAR(50);

-- Add fallover fields
ALTER TABLE print_jobs
  ADD COLUMN is_fallback BOOLEAN DEFAULT false,
  ADD COLUMN original_printer_id UUID,
  ADD COLUMN fallback_attempt INTEGER DEFAULT 0;

-- Add template fields
ALTER TABLE print_jobs
  ADD COLUMN template_id VARCHAR(100),
  ADD COLUMN order_item_ids JSONB;

-- Create indexes for new columns
CREATE INDEX idx_print_jobs_priority ON print_jobs(priority_level, created_at);
CREATE INDEX idx_print_jobs_station ON print_jobs(station_id);

-- =============================================================================
-- PART 3: ORDER STATUS ENUM UPDATE
-- =============================================================================
-- Note: The OrderStatus enum has been updated in the entity code.
-- The following states are now supported:
--
-- INITIAL: DRAFT, SAVED
-- KITCHEN: FIRED_TO_KITCHEN, PREPARING, READY, SERVED
-- PAYMENT: PAYMENT_PENDING, PAYMENT_PROCESSING, PAID, PARTIALLY_PAID
-- DELIVERY: OUT_FOR_DELIVERY, AWAITING_PICKUP
-- AGGREGATOR: RECEIVED_FROM_AGGREGATOR
-- APPROVAL: VOID_REQUESTED, VOID_APPROVED, RETURN_REQUESTED, RETURN_APPROVED
-- TERMINAL: COMPLETED, VOID, REFUNDED
-- LEGACY: PENDING (deprecated)

-- =============================================================================
-- PART 4: STORE CONFIGURATION SEEDING
-- =============================================================================

-- Insert default calculation pipeline configuration
INSERT INTO store_configurations (store_id, config_key, config_value, config_type, category, description)
SELECT
    s.id,
    'pos.calculation_pipeline',
    '{
      "version": "1.0.0",
      "storeId": "' || s.id || '",
      "pipelineId": "default-pipeline",
      "description": "Default calculation pipeline",
      "isActive": true,
      "orderTypePipelines": {
        "DINE_IN": {
          "enabled": true,
          "pipeline": [
            { "id": "step-1", "type": "ITEM_SUBTOTAL", "config": {}, "outputs": ["subtotal"] },
            { "id": "step-2", "type": "SERVICE_CHARGE", "config": {"rate": 0.12, "basis": "subtotal", "taxable": true}, "outputs": ["serviceCharge"] },
            { "id": "step-3", "type": "SUBTOTAL_BEFORE_TAX", "config": {"sumOf": ["subtotal", "serviceCharge"]}, "outputs": ["subtotalBeforeTax"] },
            { "id": "step-4", "type": "TAX", "config": {"rate": 0.14, "calculationMethod": "INCLUSIVE"}, "outputs": ["taxAmount"] },
            { "id": "step-5", "type": "DISCOUNT", "condition": {"type": "FIELD_EXISTS", "field": "discount"}, "config": {"applicationPoint": "GRAND_TOTAL"}, "outputs": ["discountAmount"] },
            { "id": "step-6", "type": "TOTAL", "config": {"formula": "subtotalBeforeTax + taxAmount - discountAmount"}, "outputs": ["totalNet"] }
          ]
        },
        "TAKEAWAY": {
          "enabled": true,
          "pipeline": [
            { "id": "step-1", "type": "ITEM_SUBTOTAL", "config": {}, "outputs": ["subtotal"] },
            { "id": "step-2", "type": "SUBTOTAL_BEFORE_TAX", "config": {"sumOf": ["subtotal"]}, "outputs": ["subtotalBeforeTax"] },
            { "id": "step-3", "type": "TAX", "config": {"rate": 0.14, "calculationMethod": "INCLUSIVE"}, "outputs": ["taxAmount"] },
            { "id": "step-4", "type": "DISCOUNT", "condition": {"type": "FIELD_EXISTS", "field": "discount"}, "config": {"applicationPoint": "GRAND_TOTAL"}, "outputs": ["discountAmount"] },
            { "id": "step-5", "type": "TOTAL", "config": {"formula": "subtotalBeforeTax + taxAmount - discountAmount"}, "outputs": ["totalNet"] }
          ]
        },
        "DELIVERY": {
          "enabled": true,
          "pipeline": [
            { "id": "step-1", "type": "ITEM_SUBTOTAL", "config": {}, "outputs": ["subtotal"] },
            { "id": "step-2", "type": "DELIVERY_FEE", "config": {"feeSource": "ZONE_LOOKUP", "taxable": true}, "outputs": ["deliveryFee"] },
            { "id": "step-3", "type": "SUBTOTAL_BEFORE_TAX", "config": {"sumOf": ["subtotal", "deliveryFee"]}, "outputs": ["subtotalBeforeTax"] },
            { "id": "step-4", "type": "TAX", "config": {"rate": 0.14, "calculationMethod": "INCLUSIVE"}, "outputs": ["taxAmount"] },
            { "id": "step-5", "type": "TOTAL", "config": {"formula": "subtotalBeforeTax + taxAmount"}, "outputs": ["totalNet"] }
          ]
        }
      },
      "discountConfigs": {
        "CORPORATE_PRESET": {"type": "percentage", "maxPercentage": 30, "requiresAuthorization": true, "authorizationLevel": "MANAGER", "applicationPoint": "GRAND_TOTAL", "applyToTax": true, "applyToServiceCharge": true, "applyToDelivery": true},
        "MANUAL_PERCENTAGE": {"type": "percentage", "maxPercentage": 15, "requiresAuthorization": true, "authorizationLevel": "MANAGER", "applicationPoint": "GRAND_TOTAL", "applyToTax": true, "applyToServiceCharge": true, "applyToDelivery": true},
        "MANUAL_AMOUNT": {"type": "fixed", "maxAmount": 100, "requiresAuthorization": true, "authorizationLevel": "MANAGER", "applicationPoint": "GRAND_TOTAL", "applyToTax": true, "applyToServiceCharge": true, "applyToDelivery": true}
      }
    }'::jsonb,
    'JSON',
    'pos',
    'Default modular calculation pipeline for order processing'
FROM stores s;

-- Insert default state machine configuration
INSERT INTO store_configurations (store_id, config_key, config_value, config_type, category, description)
SELECT
    s.id,
    'pos.state_machine_config',
    '{
      "version": "1.0.0",
      "storeId": "' || s.id || '",
      "allowedTransitions": {
        "DINE_IN": [
          {"fromState": "DRAFT", "toState": "SAVED", "requiredFields": ["tableId", "customerCount"]},
          {"fromState": "SAVED", "toState": "FIRED_TO_KITCHEN"},
          {"fromState": "FIRED_TO_KITCHEN", "toState": "PREPARING"},
          {"fromState": "PREPARING", "toState": "READY"},
          {"fromState": "READY", "toState": "SERVED"},
          {"fromState": "SERVED", "toState": "PAYMENT_PENDING"},
          {"fromState": "PAYMENT_PENDING", "toState": "PAID"},
          {"fromState": "SAVED", "toState": "PAID"},
          {"fromState": "PAID", "toState": "COMPLETED"}
        ],
        "TAKEAWAY": [
          {"fromState": "DRAFT", "toState": "PAID"},
          {"fromState": "PAID", "toState": "FIRED_TO_KITCHEN"},
          {"fromState": "FIRED_TO_KITCHEN", "toState": "PREPARING"},
          {"fromState": "PREPARING", "toState": "READY"},
          {"fromState": "READY", "toState": "COMPLETED"}
        ]
      },
      "permissionRequirements": {
        "SAVED->VOID": {"allowedRoles": ["MANAGER", "ADMIN"], "requiresManagerApproval": true},
        "PAID->VOID": {"allowedRoles": ["MANAGER", "ADMIN"], "requiresManagerApproval": true, "requiresPinVerification": true}
      }
    }'::jsonb,
    'JSON',
    'pos',
    'State machine configuration for order workflow'
FROM stores s;

-- Insert default printer routing configuration
INSERT INTO store_configurations (store_id, config_key, config_value, config_type, category, description)
SELECT
    s.id,
    'printing.printer_routing',
    '{
      "version": "1.0",
      "storeId": "' || s.id || '",
      "stationMappings": [],
      "printerGroups": [],
      "orderTypeRules": [
        {
          "orderType": "DINE_IN",
          "autoPrint": {"customerReceipt": true, "kitchenTickets": true},
          "receiptTemplateId": "RECEIPT_80MM"
        },
        {
          "orderType": "TAKEAWAY",
          "autoPrint": {"customerReceipt": true, "kitchenTickets": true},
          "receiptTemplateId": "RECEIPT_80MM"
        }
      ],
      "priorityConfig": {
        "levels": [
          {"level": 1, "name": "EMERGENCY", "queuePosition": "front", "soundAlert": true},
          {"level": 2, "name": "EXPEDITE", "queuePosition": "front", "soundAlert": true},
          {"level": 3, "name": "NORMAL", "queuePosition": "back"},
          {"level": 4, "name": "REPRINT", "queuePosition": "back"},
          {"level": 5, "name": "TEST", "queuePosition": "back"}
        ]
      }
    }'::jsonb,
    'JSON',
    'printing',
    'Printer routing and priority queue configuration'
FROM stores s;

-- =============================================================================
-- PART 5: DATA MIGRATION NOTES
-- =============================================================================
--
-- 1. Existing sales_orders records will have NULL values for new fields
--    - This is expected and handled by the application
--    - Orders created before migration will continue to work
--
-- 2. Order state history records need orderId populated
--    - A one-time data migration script should be run to populate order_id
--    - For existing records, use a dummy UUID or extract from associated order
--
-- 3. Print jobs before migration will have default priority (NORMAL)
--    - No station routing assigned
--    - Will use existing printer_id
--
-- =============================================================================

-- End of Migration
