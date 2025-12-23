import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

export enum PrinterType {
    RECEIPT = 'RECEIPT',
    KITCHEN = 'KITCHEN',
    LABEL = 'LABEL',
}

export enum PrinterConnection {
    USB = 'USB',
    NETWORK = 'NETWORK',
    BLUETOOTH = 'BLUETOOTH',
}

/**
 * Printer Entity
 * Manages all printers in the system (receipt, kitchen, label)
 */
@Entity('printers')
export class Printer extends AbstractEntity {
    @Column({ name: 'printer_name' })
    printerName: string;

    @Column({ name: 'printer_code', unique: true })
    printerCode: string;

    @Column({ type: 'enum', enum: PrinterType, name: 'printer_type' })
    printerType: PrinterType;

    @Column({ type: 'enum', enum: PrinterConnection, name: 'connection_type' })
    connectionType: PrinterConnection;

    /**
     * Connection details based on connection type
     * USB: { device_path: '/dev/usb/lp0' }
     * NETWORK: { ip: '192.168.1.100', port: 9100 }
     * BLUETOOTH: { address: 'xx:xx:xx:xx:xx:xx' }
     */
    @Column({ type: 'jsonb', name: 'connection_config' })
    connectionConfig: Record<string, any>;

    @Column({ name: 'paper_width', default: 80 })
    paperWidth: number; // mm (58, 80, etc.)

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'is_default', default: false })
    isDefault: boolean;

    @Column({ name: 'store_id' })
    storeId: string;

    /**
     * Print template settings
     */
    @Column({ type: 'jsonb', nullable: true, name: 'template_config' })
    templateConfig: {
        header_logo?: boolean;
        footer_text?: string;
        font_size?: number;
    };
}
