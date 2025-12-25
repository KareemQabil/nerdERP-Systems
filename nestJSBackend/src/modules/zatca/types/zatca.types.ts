export interface ZatcaQRData {
    sellerName: string;
    vatRegistration: string;
    timestamp: string;
    totalWithVat: string;
    vatAmount: string;
}

export interface ZatcaInvoiceData {
    invoiceNumber: string;
    issueDate: string;
    seller: {
        name: string;
        vatRegistration: string;
        address: string;
        city: string;
        postalCode: string;
        country: string;
    };
    buyer?: {
        name: string;
        vatRegistration?: string;
        address?: string;
    };
    items: Array<{
        name: string;
        quantity: string;
        unitPrice: string;
        taxRate: string;
        taxAmount: string;
        lineTotal: string;
    }>;
    totalExcludingVat: string;
    totalVat: string;
    totalIncludingVat: string;
}

export interface HashChainValidation {
    valid: boolean;
    brokenAt?: string;
    message: string;
}

export interface ZatcaProcessResult {
    invoiceHash: string;
    previousHash: string | null;
    zatcaUuid: string;
    qrCode: string;
    xmlInvoice?: string;
}
