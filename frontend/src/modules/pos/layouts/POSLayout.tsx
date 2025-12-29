/**
 * POS Layout Component
 * Main layout structure for the POS screen
 */
import React from 'react';
import './POSLayout.css';

interface POSLayoutProps {
    children: React.ReactNode;
    productSection?: React.ReactNode;
    cartSection?: React.ReactNode;
    actionSection?: React.ReactNode;
}

export function POSLayout({
    children,
    productSection,
    cartSection,
    actionSection
}: POSLayoutProps) {
    return (
        <div className="pos-layout">
            {/* Main Content Area */}
            <div className="pos-layout__content">
                {/* Product Section (Left) */}
                <section className="pos-layout__products">
                    {productSection || children}
                </section>

                {/* Cart Section (Right) */}
                <aside className="pos-layout__cart">
                    {cartSection}
                </aside>
            </div>

            {/* Action Bar (Bottom) */}
            <footer className="pos-layout__actions">
                {actionSection}
            </footer>
        </div>
    );
}
