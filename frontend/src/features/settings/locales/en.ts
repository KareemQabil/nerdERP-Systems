/**
 * Settings Feature - English Translations
 */
export default {
    title: 'Settings',
    general: {
        title: 'General Settings',
        language: 'Language',
        theme: 'Theme',
        themeLight: 'Light',
        themeDark: 'Dark',
        themeSystem: 'System',
        direction: 'Direction',
        directionLtr: 'Left to Right',
        directionRtl: 'Right to Left',
    },
    pos: {
        title: 'POS Settings',
        defaultOrderType: 'Default Order Type',
        enabledOrderTypes: 'Enabled Order Types',
        taxRate: 'Tax Rate',
        serviceCharge: 'Service Charge',
        requireCustomerForDelivery: 'Require Customer for Delivery',
        requireTableForDineIn: 'Require Table for Dine-In',
        allowNegativeStock: 'Allow Negative Stock',
        printReceiptOnComplete: 'Print Receipt on Complete',
        openCashDrawerOnCash: 'Open Cash Drawer on Cash Payment',
    },
    receipt: {
        title: 'Receipt Settings',
        headerText: 'Header Text',
        footerText: 'Footer Text',
        showLogo: 'Show Logo',
        showTaxDetails: 'Show Tax Details',
        showBarcode: 'Show Barcode',
        showQrCode: 'Show QR Code',
    },
    security: {
        title: 'Security Settings',
        requirePinForVoid: 'Require PIN for Void',
        requirePinForDiscount: 'Require PIN for Discount',
        requirePinForRefund: 'Require PIN for Refund',
        sessionTimeout: 'Session Timeout (minutes)',
        maxDiscountPercent: 'Maximum Discount Percentage',
    },
    notifications: {
        title: 'Notifications',
        lowStockAlert: 'Low Stock Alerts',
        orderNotifications: 'Order Notifications',
        kitchenAlerts: 'Kitchen Alerts',
        soundEnabled: 'Sound Enabled',
    },
    actions: {
        save: 'Save Settings',
        reset: 'Reset to Defaults',
        export: 'Export Settings',
        import: 'Import Settings',
    },
    feedback: {
        saved: 'Settings saved successfully',
        reset: 'Settings reset to defaults',
        error: 'Failed to save settings',
    },
};
