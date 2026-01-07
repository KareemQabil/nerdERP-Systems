import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Store } from '../../organization/entities/store.entity';

/**
 * =============================================================================
 * PRINT TEMPLATE TYPES
 * =============================================================================
 */

/**
 * Template Types
 */
export enum TemplateType {
  RECEIPT = 'RECEIPT',               // Customer receipt
  KITCHEN_TICKET = 'KITCHEN_TICKET', // Kitchen order ticket
  DELIVERY_LABEL = 'DELIVERY_LABEL', // Delivery label/sticker
  INVOICE = 'INVOICE',               // Formal invoice (A4)
  TEST = 'TEST',                     // Test print
}

/**
 * Paper Sizes
 */
export enum PaperSize {
  THERMAL_58MM = 'THERMAL_58MM',
  THERMAL_80MM = 'THERMAL_80MM',
  A4 = 'A4',
}

/**
 * Template Section Types
 */
export enum SectionType {
  HEADER = 'HEADER',
  BODY = 'BODY',
  FOOTER = 'FOOTER',
  CUSTOM = 'CUSTOM',
}

/**
 * Content Types
 */
export enum ContentType {
  TEXT = 'TEXT',
  VARIABLE = 'VARIABLE',
  LINE = 'LINE',
  IMAGE = 'IMAGE',
  BARCODE = 'BARCODE',
  TABLE = 'TABLE',
}

/**
 * Text Alignment
 */
export enum TextAlignment {
  LEFT = 'LEFT',
  CENTER = 'CENTER',
  RIGHT = 'RIGHT',
}

/**
 * Template Section Configuration
 */
export interface TemplateSection {
  id: string;
  type: SectionType;
  label?: string;
  visible: boolean;
  content: TemplateContent[];
}

/**
 * Template Content Item
 */
export interface TemplateContent {
  type: ContentType;
  text?: string;
  variable?: string;          // e.g., '{{orderNumber}}', '{{total}}'
  width?: number;             // Characters width
  align?: TextAlignment;
  bold?: boolean;
  underline?: boolean;
  fontSize?: 'small' | 'normal' | 'large';
  repeat?: number;            // For LINE type
}

/**
 * Template Variable Definition
 */
export interface TemplateVariable {
  key: string;                // e.g., 'orderNumber', 'total', 'vatAmount'
  label: string;
  labelAr?: string;           // Arabic label
  dataType: 'string' | 'number' | 'currency' | 'date' | 'boolean';
  format?: string;            // e.g., 'YYYY-MM-DD', '0.00', etc.
  required: boolean;
}

/**
 * Template Formatting Options
 */
export interface TemplateFormatting {
  fontSize?: 'small' | 'normal' | 'large';
  alignment?: TextAlignment;
  lineHeight?: number;
  characterSet?: 'UTF8' | 'CP437';
  padding?: {
    left?: number;
    right?: number;
  };
}

/**
 * Barcode Configuration
 */
export interface TemplateBarcode {
  enabled: boolean;
  type: 'QR' | 'CODE128' | 'EAN13';
  position: 'header' | 'footer';
  width?: number;
  height?: number;
}

/**
 * Complete Template Configuration
 */
export interface TemplateConfig {
  sections: TemplateSection[];
  variables: TemplateVariable[];
  formatting: TemplateFormatting;
  barcode?: TemplateBarcode;
}

/**
 * =============================================================================
 * ENTITY: PrintTemplate
 * =============================================================================
 *
 * Manages customizable receipt/ticket templates.
 *
 * Features:
 * - Visual template builder (JSONB configuration)
 * - Variable substitution ({{orderNumber}}, {{total}}, etc.)
 * - Multi-paper size support (58mm, 80mm thermal, A4)
 * - Multi-language support (English/Arabic)
 * - Barcode/QR code support
 * - System vs custom templates
 *
 * Template Variables:
 * - {{orderNumber}} - Order serial number
 * - {{orderDate}}, {{orderTime}} - Date and time
 * - {{serverName}} - Staff name
 * - {{tableNumber}} - Table number
 * - {{orderType}} - DINE_IN, TAKEAWAY, etc.
 * - {{items}} - Items table
 * - {{subtotal}} - Subtotal amount
 * - {{serviceCharge}} - Service charge amount
 * - {{taxAmount}} - VAT/tax amount
 * - {{discountAmount}} - Discount amount
 * - {{total}} - Grand total
 * - {{paymentMethod}} - Payment method
 * - {{amountPaid}} - Amount paid
 * - {{changeAmount}} - Change given
 * - {{storeName}} - Store name
 * - {{storeAddress}} - Store address
 * - {{storePhone}} - Store phone
 * - {{zatcaQrData}} - ZATCA QR code data
 *
 * @example
 * // Receipt Template Configuration
 * {
 *   "templateCode": "RECEIPT_80MM",
 *   "templateType": "RECEIPT",
 *   "paperSize": "THERMAL_80MM",
 *   "config": {
 *     "sections": [
 *       {
 *         "id": "header",
 *         "type": "HEADER",
 *         "visible": true,
 *         "content": [
 *           { "type": "TEXT", "text": "NERDPOS STORE", "align": "CENTER", "bold": true },
 *           { "type": "TEXT", "text": "123 Main Street", "align": "CENTER" },
 *           { "type": "VARIABLE", "variable": "{{orderDate}}", "align": "CENTER" },
 *           { "type": "LINE" }
 *         ]
 *       },
 *       {
 *         "id": "items",
 *         "type": "BODY",
 *         "visible": true,
 *         "content": [
 *           { "type": "TABLE", "variable": "{{items}}" }
 *         ]
 *       },
 *       {
 *         "id": "totals",
 *         "type": "FOOTER",
 *         "visible": true,
 *         "content": [
 *           { "type": "LINE" },
 *           { "type": "TEXT", "text": "Subtotal: {{subtotal}}" },
 *           { "type": "TEXT", "text": "VAT (15%): {{taxAmount}}" },
 *           { "type": "TEXT", "text": "TOTAL: {{total}}", "bold": true }
 *         ]
 *       }
 *     ],
 *     "variables": [...],
 *     "formatting": { "fontSize": "normal", "alignment": "LEFT" },
 *     "barcode": { "enabled": true, "type": "QR", "position": "footer" }
 *   }
 * }
 */
@Entity('print_templates')
export class PrintTemplate extends AbstractEntity {
  // =========================================================================
  // STORE RELATIONSHIP
  // =========================================================================

  @ManyToOne(() => Store, { nullable: true })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  /**
   * Store ID (null for global/system templates)
   */
  @Column({ name: 'store_id', nullable: true })
  storeId: string;

  // =========================================================================
  // TEMPLATE IDENTIFICATION
  // =========================================================================

  /**
   * Human-readable template name
   */
  @Column({ name: 'template_name' })
  templateName: string;

  /**
   * Unique template code
   * e.g., 'RECEIPT_80MM', 'KITCHEN_58MM', 'INVOICE_A4'
   */
  @Column({ name: 'template_code', unique: true })
  templateCode: string;

  /**
   * Template description
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  // =========================================================================
  // TEMPLATE TYPE & PAPER SIZE
  // =========================================================================

  /**
   * Type of template
   */
  @Column({
    name: 'template_type',
    type: 'enum',
    enum: TemplateType,
  })
  templateType: TemplateType;

  /**
   * Paper size
   */
  @Column({
    name: 'paper_size',
    type: 'enum',
    enum: PaperSize,
  })
  paperSize: PaperSize;

  // =========================================================================
  // TEMPLATE CONFIGURATION
  // =========================================================================

  /**
   * Complete template configuration (JSONB)
   * Contains sections, variables, formatting, barcode settings
   */
  @Column({ type: 'jsonb', name: 'config' })
  config: TemplateConfig;

  /**
   * Raw HTML/ESC-POS template
   * For advanced users who want to write raw template code
   */
  @Column({ type: 'text', nullable: true, name: 'raw_template' })
  rawTemplate: string;

  // =========================================================================
  // TEMPLATE FLAGS
  // =========================================================================

  /**
   * Whether this is a system template
   * System templates cannot be deleted
   */
  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  /**
   * Whether this template is active
   */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * Template version
   * For tracking changes
   */
  @Column({ name: 'version', default: '1.0' })
  version: string;

  // =========================================================================
  // CATEGORY & ORGANIZATION
  // =========================================================================

  /**
   * Category for grouping templates
   */
  @Column({ name: 'category', nullable: true })
  category: string;

  /**
   * Display order in lists
   */
  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  // =========================================================================
  // LANGUAGE & LOCALIZATION
  // =========================================================================

  /**
   * Primary language
   */
  @Column({ name: 'language', default: 'en' })
  language: string;

  /**
   * RTL (Right-to-Left) support for Arabic
   */
  @Column({ name: 'is_rtl', default: false })
  isRtl: boolean;

  // =========================================================================
  // PREVIEW
  // =========================================================================

  /**
   * Preview image URL
   */
  @Column({ name: 'preview_image_url', nullable: true })
  previewImageUrl: string;

  // =========================================================================
  // METADATA
  // =========================================================================

  /**
   * Additional metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // =========================================================================
  // METHODS
  // =========================================================================

  /**
   * Render template with provided variables
   */
  render(variables: Record<string, any>): string {
    let output = '';

    for (const section of this.config.sections) {
      if (!section.visible) continue;

      for (const content of section.content) {
        output += this.renderContent(content, variables);
      }
    }

    return output;
  }

  /**
   * Render a single content item
   */
  private renderContent(content: TemplateContent, variables: Record<string, any>): string {
    switch (content.type) {
      case ContentType.TEXT:
        return this.formatText(content.text || '', content);

      case ContentType.VARIABLE:
        const value = this.getVariableValue(content.variable || '', variables);
        return this.formatText(String(value), content);

      case ContentType.LINE:
        const width = content.width || 32;
        return '-'.repeat(width) + '\n';

      case ContentType.TABLE:
        // Table rendering would be more complex
        return this.renderTable(content.variable || '', variables);

      default:
        return '';
    }
  }

  /**
   * Get variable value with fallback
   */
  private getVariableValue(variableKey: string, variables: Record<string, any>): any {
    // Remove {{ }} wrapper if present
    const key = variableKey.replace(/\{\{|\}\}/g, '').trim();
    return variables[key] || `[${key}]`;
  }

  /**
   * Format text with alignment and styling
   */
  private formatText(text: string, content: TemplateContent): string {
    let formatted = text;

    // Apply bold (could be ESC/POS commands)
    if (content.bold) {
      // formatted = `\x1B\x45${formatted}\x1B\x46`; // ESC/POS bold on/off
    }

    // Apply alignment
    const width = content.width || 32;
    const align = content.align || TextAlignment.LEFT;

    switch (align) {
      case TextAlignment.CENTER:
        formatted = this.padCenter(formatted, width);
        break;
      case TextAlignment.RIGHT:
        formatted = this.padLeft(formatted, width);
        break;
      default:
        formatted = this.padRight(formatted, width);
    }

    return formatted + '\n';
  }

  /**
   * Table rendering (simplified)
   */
  private renderTable(variableKey: string, variables: Record<string, any>): string {
    const items = variables[variableKey.replace(/\{\{|\}\}/g, '').trim()];
    if (!Array.isArray(items)) return '';

    let output = '';
    for (const item of items) {
      output += `${item.name || item.productName}\n`;
      output += `  ${item.quantity} x ${item.unitPrice} = ${item.total}\n`;
    }
    return output;
  }

  // Text padding helpers
  private padLeft(str: string, width: number): string {
    return str.padStart(width);
  }

  private padRight(str: string, width: number): string {
    return str.padEnd(width);
  }

  private padCenter(str: string, width: number): string {
    const pad = Math.max(0, width - str.length);
    const left = Math.floor(pad / 2);
    const right = pad - left;
    return ' '.repeat(left) + str + ' '.repeat(right);
  }

  /**
   * Validate template configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.sections || this.config.sections.length === 0) {
      errors.push('Template must have at least one section');
    }

    for (const section of this.config.sections) {
      if (!section.id) {
        errors.push('Section must have an ID');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clone template
   */
  clone(newCode: string, newName: string): Partial<PrintTemplate> {
    return {
      templateCode: newCode,
      templateName: newName,
      templateType: this.templateType,
      paperSize: this.paperSize,
      config: JSON.parse(JSON.stringify(this.config)),
      isSystem: false,
      version: '1.0',
    };
  }
}
