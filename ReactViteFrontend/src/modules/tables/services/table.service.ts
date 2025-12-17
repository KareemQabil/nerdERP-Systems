// Stub service for tables - will be fully implemented later
export class TableService {
    static async getTables(params?: { search?: string }): Promise<any[]> {
        console.log('TableService.getTables called with params:', params);
        // Return mock data for now
        return [
            {
                id: 'table-1',
                number: '1',
                name: 'Table 1',
                capacity: 4,
                status: 'available',
                currentOrderId: null,
            },
            {
                id: 'table-2',
                number: '2',
                name: 'Table 2',
                capacity: 6,
                status: 'available',
                currentOrderId: null,
            },
        ];
    }

    static async getTableById(tableId: string): Promise<any> {
        const tables = await this.getTables({ search: tableId });
        return tables.find(t => t.id === tableId) || null;
    }
}
