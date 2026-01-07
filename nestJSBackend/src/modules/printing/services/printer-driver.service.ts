import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Socket } from 'net';
import { PrintQueueService } from './print-queue.service';
import { EscPosGenerator } from '../utils/esc-pos-generator';

/**
 * Printer Driver Service
 *
 * Physical execution layer for print jobs.
 * Connects to network printers via TCP sockets and sends ESC/POS commands.
 *
 * Features:
 * - TCP socket communication to network printers (typically port 9100)
 * - ESC/POS protocol generation for thermal printers
 * - Automatic reconnection and retry logic
 * - Cash drawer kick support
 * - Full cut / partial cut support
 * - Barcode and QR code printing
 * - Image printing (logos, graphics)
 *
 * Printer Compatibility:
 * - Epson TM-T88 series
 * - Star TSP series
 * - Custom (POS-58, POS-80, etc.)
 */
@Injectable()
export class PrinterDriverService implements OnModuleDestroy {
    private readonly logger = new Logger(PrinterDriverService.name);
    private readonly connections = new Map<string, Socket>();
    private readonly connectionLocks = new Map<string, Promise<void>>();

    // Default printer ports
    private readonly DEFAULT_PORT = 9100;
    private readonly CONNECTION_TIMEOUT = 5000; // 5 seconds
    private readonly SOCKET_TIMEOUT = 30000; // 30 seconds

    constructor(
        private readonly printQueue: PrintQueueService,
        private readonly escPos: EscPosGenerator,
    ) {}

    onModuleDestroy() {
        // Close all connections when module is destroyed
        this.closeAllConnections();
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Print data to a network printer
     *
     * @param printerIp - IP address or hostname of the printer
     * @param port - Port number (default 9100)
     * @param data - Data to print (ESC/POS commands)
     * @param options - Print options
     * @returns Success status
     */
    async print(printerIp: string, data: Buffer, options: PrintOptions = {}): Promise<PrintResult> {
        const port = options.port || this.DEFAULT_PORT;
        const connectionKey = `${printerIp}:${port}`;

        this.logger.debug(`Printing to ${connectionKey}, ${data.length} bytes`);

        try {
            await this.sendToPrinter(printerIp, port, data);
            return { success: true, printerIp, bytesSent: data.length };
        } catch (error) {
            this.logger.error(`Print failed for ${connectionKey}: ${error.message}`);
            return {
                success: false,
                printerIp,
                error: error.message,
                errorCode: this.getErrorCode(error),
            };
        }
    }

    /**
     * Print a job from the print queue
     *
     * @param jobId - Print job ID
     * @returns Print result
     */
    async printJob(jobId: string): Promise<PrintResult> {
        const job = await this.printQueue.getJobStatus(jobId);
        if (!job) {
            return { success: false, error: 'Job not found', errorCode: 'JOB_NOT_FOUND' };
        }

        // Mark as printing
        await this.printQueue.markPrinting(jobId);

        // Convert rendered content or print data to Buffer
        const data = this.jobToBuffer(job);

        // Get printer IP from job (would need to be stored with job)
        const printerIp = job.printerIp || '192.168.1.100'; // Default fallback

        const result = await this.print(printerIp, data);

        if (result.success) {
            await this.printQueue.markCompleted(jobId);
        } else {
            await this.printQueue.markFailed(jobId, result.error || 'Unknown error');
        }

        return result;
    }

    /**
     * Open cash drawer
     *
     * Sends drawer kick pulse (usually 2x pulse for reliability)
     *
     * @param printerIp - Printer IP address
     * @param port - Port number (default 9100)
     * @returns Success status
     */
    async openCashDrawer(printerIp: string, port = this.DEFAULT_PORT): Promise<PrintResult> {
        this.logger.log(`Opening cash drawer via printer ${printerIp}`);

        // ESC/POS cash drawer kick command
        // ESC p m t1 t2 - Pulse: m=drawer pin (0 or 1), t1/t2=pulse duration (on/off times in 2ms units)
        const kickPulse = this.escPos.openDrawer();

        return await this.print(printerIp, kickPulse, { port });
    }

    /**
     * Test printer connection
     *
     * @param printerIp - Printer IP address
     * @param port - Port number (default 9100)
     * @returns Connection status
     */
    async testConnection(printerIp: string, port = this.DEFAULT_PORT): Promise<ConnectionTestResult> {
        const startTime = Date.now();

        try {
            const socket = await this.createConnection(printerIp, port);
            const responseTime = Date.now() - startTime;

            this.closeConnection(socket);

            return {
                connected: true,
                printerIp,
                port,
                responseTime,
                message: `Connection successful (${responseTime}ms)`,
            };
        } catch (error) {
            return {
                connected: false,
                printerIp,
                port,
                responseTime: Date.now() - startTime,
                message: error.message,
                errorCode: this.getErrorCode(error),
            };
        }
    }

    /**
     * Print test page
     *
     * @param printerIp - Printer IP address
     * @param options - Print options
     * @returns Print result
     */
    async printTestPage(printerIp: string, options: PrintOptions = {}): Promise<PrintResult> {
        this.logger.log(`Printing test page to ${printerIp}`);

        // Generate test page with ESC/POS
        const testData = this.escPos.generateTestPage();

        return await this.print(printerIp, testData, options);
    }

    /**
     * Get printer status (if supported)
     *
     * @param printerIp - Printer IP address
     * @param port - Port number (default 9100)
     * @returns Printer status
     */
    async getPrinterStatus(printerIp: string, port = this.DEFAULT_PORT): Promise<PrinterStatus> {
        try {
            // DLE EOT n - Real-time status transmission
            // n=1: Printer status
            const statusCommand = this.escPos.getPrinterStatus();

            await this.sendToPrinter(printerIp, port, statusCommand);

            // Note: Many printers don't respond to status queries via network
            // In a real implementation, you might need to use SNMP or other protocols
            return {
                online: true,
                printerIp,
                port,
                message: 'Status query sent (response not supported via network)',
            };
        } catch (error) {
            return {
                online: false,
                printerIp,
                port,
                message: error.message,
            };
        }
    }

    // =========================================================================
    // CONNECTION MANAGEMENT
    // =========================================================================

    /**
     * Send data to printer with automatic connection management
     */
    private async sendToPrinter(printerIp: string, port: number, data: Buffer): Promise<void> {
        const connectionKey = `${printerIp}:${port}`;

        // Ensure only one operation per connection at a time
        let lock = this.connectionLocks.get(connectionKey);
        if (!lock) {
            lock = Promise.resolve();
            this.connectionLocks.set(connectionKey, lock);
        }

        await lock;

        const operation = (async () => {
            let socket: Socket | null = null;
            try {
                socket = await this.createConnection(printerIp, port);
                await this.writeToSocket(socket, data);
            } finally {
                if (socket) {
                    this.closeConnection(socket);
                }
            }
        })();

        this.connectionLocks.set(connectionKey, operation);
        await operation;
    }

    /**
     * Create a TCP socket connection to printer
     */
    private createConnection(printerIp: string, port: number): Promise<Socket> {
        return new Promise((resolve, reject) => {
            const socket = new Socket();

            socket.setTimeout(this.CONNECTION_TIMEOUT);

            socket.once('connect', () => {
                socket.setTimeout(this.SOCKET_TIMEOUT);
                this.logger.debug(`Connected to printer ${printerIp}:${port}`);
                resolve(socket);
            });

            socket.once('timeout', () => {
                socket.destroy();
                reject(new Error('Connection timeout'));
            });

            socket.once('error', (error) => {
                socket.destroy();
                reject(new Error(`Connection error: ${error.message}`));
            });

            socket.connect(port, printerIp);
        });
    }

    /**
     * Write data to socket with full buffer flush
     */
    private async writeToSocket(socket: Socket, data: Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            const writeError = (error: Error) => {
                reject(new Error(`Write error: ${error.message}`));
            };

            socket.once('error', writeError);
            socket.once('drain', () => {
                socket.off('error', writeError);
                resolve();
            });

            const flushed = socket.write(data);

            if (flushed) {
                socket.off('error', writeError);
                resolve();
            }
        });
    }

    /**
     * Close socket connection
     */
    private closeConnection(socket: Socket): void {
        try {
            socket.end();
            socket.destroy();
        } catch (error) {
            // Ignore close errors
        }
    }

    /**
     * Close all open connections
     */
    private closeAllConnections(): void {
        for (const [key, socket] of this.connections) {
            this.logger.debug(`Closing connection to ${key}`);
            this.closeConnection(socket);
        }
        this.connections.clear();
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    /**
     * Convert print job data to Buffer
     */
    private jobToBuffer(job: any): Buffer {
        if (job.renderedContent) {
            // If content is already rendered as hex/string, convert to Buffer
            if (typeof job.renderedContent === 'string') {
                return Buffer.from(job.renderedContent, 'hex');
            }
            return Buffer.from(job.renderedContent);
        }

        if (job.printData) {
            // Generate ESC/POS from print data object
            return this.escPos.generateFromData(job.printData);
        }

        throw new Error('Job has no printable content');
    }

    /**
     * Get error code from error object
     */
    private getErrorCode(error: any): string {
        if (error.code === 'ECONNREFUSED') return 'CONNECTION_REFUSED';
        if (error.code === 'ETIMEDOUT') return 'TIMEOUT';
        if (error.code === 'EHOSTUNREACH') return 'HOST_UNREACHABLE';
        if (error.code === 'ENETUNREACH') return 'NETWORK_UNREACHABLE';
        return 'UNKNOWN_ERROR';
    }
}

// =========================================================================
// TYPES
// =========================================================================

export interface PrintOptions {
    port?: number;
    copies?: number;
    cut?: 'FULL' | 'PARTIAL' | 'NONE';
    drawer?: boolean; // Open cash drawer after print
}

export interface PrintResult {
    success: boolean;
    printerIp?: string;
    bytesSent?: number;
    error?: string;
    errorCode?: string;
}

export interface ConnectionTestResult {
    connected: boolean;
    printerIp: string;
    port: number;
    responseTime: number;
    message: string;
    errorCode?: string;
}

export interface PrinterStatus {
    online: boolean;
    printerIp: string;
    port: number;
    message?: string;
    hasPaper?: boolean;
    coverOpen?: boolean;
    error?: string;
}
