/**
 * Settings Feature - Arabic Translations
 */
export default {
    title: 'الإعدادات',
    general: {
        title: 'الإعدادات العامة',
        language: 'اللغة',
        theme: 'المظهر',
        themeLight: 'فاتح',
        themeDark: 'داكن',
        themeSystem: 'النظام',
        direction: 'الاتجاه',
        directionLtr: 'من اليسار إلى اليمين',
        directionRtl: 'من اليمين إلى اليسار',
    },
    pos: {
        title: 'إعدادات نقطة البيع',
        defaultOrderType: 'نوع الطلب الافتراضي',
        enabledOrderTypes: 'أنواع الطلبات المفعّلة',
        taxRate: 'نسبة الضريبة',
        serviceCharge: 'رسوم الخدمة',
        requireCustomerForDelivery: 'يتطلب عميل للتوصيل',
        requireTableForDineIn: 'يتطلب طاولة للطعام الداخلي',
        allowNegativeStock: 'السماح بالمخزون السالب',
        printReceiptOnComplete: 'طباعة الفاتورة عند الإكمال',
        openCashDrawerOnCash: 'فتح درج النقد عند الدفع نقداً',
    },
    receipt: {
        title: 'إعدادات الفاتورة',
        headerText: 'نص الرأس',
        footerText: 'نص التذييل',
        showLogo: 'إظهار الشعار',
        showTaxDetails: 'إظهار تفاصيل الضريبة',
        showBarcode: 'إظهار الباركود',
        showQrCode: 'إظهار رمز QR',
    },
    security: {
        title: 'إعدادات الأمان',
        requirePinForVoid: 'يتطلب PIN للإلغاء',
        requirePinForDiscount: 'يتطلب PIN للخصم',
        requirePinForRefund: 'يتطلب PIN للاسترجاع',
        sessionTimeout: 'مهلة الجلسة (دقائق)',
        maxDiscountPercent: 'الحد الأقصى لنسبة الخصم',
    },
    notifications: {
        title: 'الإشعارات',
        lowStockAlert: 'تنبيهات المخزون المنخفض',
        orderNotifications: 'إشعارات الطلبات',
        kitchenAlerts: 'تنبيهات المطبخ',
        soundEnabled: 'الصوت مفعّل',
    },
    actions: {
        save: 'حفظ الإعدادات',
        reset: 'استعادة الافتراضي',
        export: 'تصدير الإعدادات',
        import: 'استيراد الإعدادات',
    },
    feedback: {
        saved: 'تم حفظ الإعدادات بنجاح',
        reset: 'تم استعادة الإعدادات الافتراضية',
        error: 'فشل في حفظ الإعدادات',
    },
};
