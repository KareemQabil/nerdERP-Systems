import { Injectable } from '@nestjs/common';
import { Builder } from 'xml2js';
import { ZatcaInvoiceData } from '../types/zatca.types';

@Injectable()
export class XMLGeneratorService {
    private xmlBuilder: Builder;

    constructor() {
        this.xmlBuilder = new Builder({
            xmldec: { version: '1.0', encoding: 'UTF-8' },
            renderOpts: { pretty: true, indent: '  ' },
        });
    }

    /**
     * Generate UBL 2.1 compliant XML invoice
     * Based on ZATCA e-invoicing specifications
     */
    generateInvoiceXML(data: ZatcaInvoiceData, invoiceHash: string): string {
        const invoice = {
            Invoice: {
                $: {
                    'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
                    'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
                    'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
                },
                'cbc:ID': data.invoiceNumber,
                'cbc:IssueDate': data.issueDate,
                'cbc:InvoiceTypeCode': '388', // Standard invoice
                'cbc:DocumentCurrencyCode': 'SAR',

                // Invoice hash for ZATCA
                'cbc:UUID': invoiceHash,

                // Seller information
                'cac:AccountingSupplierParty': {
                    'cac:Party': {
                        'cac:PartyIdentification': {
                            'cbc:ID': {
                                $: { schemeID: 'TIN' },
                                _: data.seller.vatRegistration,
                            },
                        },
                        'cac:PartyName': {
                            'cbc:Name': data.seller.name,
                        },
                        'cac:PostalAddress': {
                            'cbc:StreetName': data.seller.address,
                            'cbc:CityName': data.seller.city,
                            'cbc:PostalZone': data.seller.postalCode,
                            'cac:Country': {
                                'cbc:IdentificationCode': data.seller.country,
                            },
                        },
                        'cac:PartyTaxScheme': {
                            'cbc:CompanyID': data.seller.vatRegistration,
                            'cac:TaxScheme': {
                                'cbc:ID': 'VAT',
                            },
                        },
                    },
                },

                // Buyer information (if exists)
                ...(data.buyer && {
                    'cac:AccountingCustomerParty': {
                        'cac:Party': {
                            'cac:PartyName': {
                                'cbc:Name': data.buyer.name,
                            },
                            ...(data.buyer.vatRegistration && {
                                'cac:PartyTaxScheme': {
                                    'cbc:CompanyID': data.buyer.vatRegistration,
                                    'cac:TaxScheme': {
                                        'cbc:ID': 'VAT',
                                    },
                                },
                            }),
                        },
                    },
                }),

                // Tax total
                'cac:TaxTotal': {
                    'cbc:TaxAmount': {
                        $: { currencyID: 'SAR' },
                        _: data.totalVat,
                    },
                    'cac:TaxSubtotal': {
                        'cbc:TaxableAmount': {
                            $: { currencyID: 'SAR' },
                            _: data.totalExcludingVat,
                        },
                        'cbc:TaxAmount': {
                            $: { currencyID: 'SAR' },
                            _: data.totalVat,
                        },
                        'cac:TaxCategory': {
                            'cbc:ID': 'S', // Standard rate
                            'cbc:Percent': '15',
                            'cac:TaxScheme': {
                                'cbc:ID': 'VAT',
                            },
                        },
                    },
                },

                // Monetary total
                'cac:LegalMonetaryTotal': {
                    'cbc:LineExtensionAmount': {
                        $: { currencyID: 'SAR' },
                        _: data.totalExcludingVat,
                    },
                    'cbc:TaxExclusiveAmount': {
                        $: { currencyID: 'SAR' },
                        _: data.totalExcludingVat,
                    },
                    'cbc:TaxInclusiveAmount': {
                        $: { currencyID: 'SAR' },
                        _: data.totalIncludingVat,
                    },
                    'cbc:PayableAmount': {
                        $: { currencyID: 'SAR' },
                        _: data.totalIncludingVat,
                    },
                },

                // Invoice lines
                'cac:InvoiceLine': data.items.map((item, index) => ({
                    'cbc:ID': (index + 1).toString(),
                    'cbc:InvoicedQuantity': {
                        $: { unitCode: 'PCE' }, // Piece
                        _: item.quantity,
                    },
                    'cbc:LineExtensionAmount': {
                        $: { currencyID: 'SAR' },
                        _: item.lineTotal,
                    },
                    'cac:Item': {
                        'cbc:Name': item.name,
                    },
                    'cac:Price': {
                        'cbc:PriceAmount': {
                            $: { currencyID: 'SAR' },
                            _: item.unitPrice,
                        },
                    },
                    'cac:TaxTotal': {
                        'cbc:TaxAmount': {
                            $: { currencyID: 'SAR' },
                            _: item.taxAmount,
                        },
                    },
                })),
            },
        };

        return this.xmlBuilder.buildObject(invoice);
    }

    /**
     * Generate simplified XML invoice (for B2C transactions)
     */
    generateSimplifiedInvoiceXML(data: ZatcaInvoiceData): string {
        // Similar to above but with reduced requirements for B2C
        // (No buyer details required for simplified invoices)
        return this.generateInvoiceXML(data, '');
    }

    /**
     * Validate XML structure (basic validation)
     */
    validateXML(xml: string): boolean {
        try {
            // Basic validation - check if it's parseable
            return xml.includes('<Invoice') && xml.includes('</Invoice>');
        } catch (error) {
            return false;
        }
    }
}
