import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface POSLayoutProps {
    navigation: ReactNode;
    productBrowser: ReactNode;
    cartPanel: ReactNode;
    bottomBar: ReactNode;
    className?: string;
}

/**
 * POSLayout Organism
 * Professional POS layout with cart toggle state management
 * 
 * Layout Structure (RTL):
 * - Right: MainNavigation (80px fixed sidebar, z-50)
 * - Center: ProductBrowser (flexible, scrollable, adjusts margin when cart open)
 * - Left: CartPanel (380px fixed, z-50, slides in/out)
 * - Bottom: POSBottomBar (spanning full width except sidebar, z-60)
 * 
 * Z-Index Hierarchy (LEGACY_POS_SPEC Section 4):
 * - Base Content: z-auto (product grid)
 * - Sticky Panels: z-50 (navigation, cart)
 * - Action Bar: z-60 (always on top)
 * - Modals: z-50 (managed by AnimatePresence)
 * 
 * State Management:
 * - isCartOpen: Controls CartPanel visibility and content margin
 * - Passed to CartPanel for animation
 * - Passed to POSBottomBar for toggle button
 * 
 * @example
 * <POSLayout
 *   navigation={<MainNavigation />}
 *   productBrowser={<ProductBrowser />}
 *   cartPanel={<CartPanel />}
 *   bottomBar={<POSBottomBar />}
 * />
 */
export function POSLayout({
    navigation,
    productBrowser,
    cartPanel,
    bottomBar,
    className,
}: POSLayoutProps) {
    // Cart toggle state - managed here and passed down
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Clone bottomBar to inject cart toggle handler
    const bottomBarWithProps = typeof bottomBar === 'object' && bottomBar !== null
        ? {
            ...bottomBar,
            props: {
                ...(bottomBar as any).props,
                onCartToggle: () => setIsCartOpen(!isCartOpen),
                isCartOpen,
            }
        }
        : bottomBar;

    return (
        <div
            className={cn(
                'h-screen w-screen overflow-hidden',
                // LEGACY_POS_SPEC: Background gradient applied to root
                'bg-gradient-to-b from-[#023047] to-[#001219]',
                className
            )}
        >
            {/* Main Content Area - Scrollable, adjusts margin when cart is open */}
            <motion.div
                animate={{
                    marginLeft: isCartOpen ? '380px' : '0px'
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="min-h-screen pr-20 pb-24"
            >
                {/* Screen Padding per spec: pt-6, pb-24 (action bar clearance), px-4 */}
                <div className="pt-6 px-4 pb-24">
                    {productBrowser}
                </div>
            </motion.div>

            {/* Cart Panel - Fixed Left, z-50, AnimatePresence for smooth entry/exit */}
            <AnimatePresence mode="wait">
                {isCartOpen && (
                    <div className="z-50">
                        {cartPanel}
                    </div>
                )}
            </AnimatePresence>

            {/* Main Navigation Sidebar - Fixed Right, z-50 */}
            <div className="z-50">
                {navigation}
            </div>

            {/* POS Action Bar - Fixed Bottom, z-60 (above all panels) */}
            <div className="z-60">
                {bottomBarWithProps}
            </div>
        </div>
    );
}
