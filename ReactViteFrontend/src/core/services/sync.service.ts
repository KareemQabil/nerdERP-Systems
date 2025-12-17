// Stub service for sync operations - will be fully implemented later
export class SyncService {
    static async processSale(saleData: any): Promise<void> {
        console.log('SyncService.processSale called with:', saleData);
        // TODO: Implement actual sync logic with backend
    }

    static async occupyTable(tableData: any): Promise<void> {
        console.log('SyncService.occupyTable called with:', tableData);
        // TODO: Implement actual table occupation sync
    }

    static async freeTable(tableId: string, tableNumber: string): Promise<void> {
        console.log('SyncService.freeTable called for table:', tableId, tableNumber);
        // TODO: Implement actual table release sync
    }
}
