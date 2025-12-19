import { useState, type ReactNode, cloneElement, isValidElement } from 'react';
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
 * Professional POS layout with synchronized cart and bottom bar animation
 * 
 * Layout Structure (RTL):
 * - Right: MainNavigation (80px fixed sidebar, z-50)
 * - Center: ProductBrowser (flexible, scrollable, adjusts margin when cart open)
 * - Left: CartPanel (380px fixed, z-40)
 * - Bottom: POSBottomBar (animated container, z-60 - HIGHEST)
 * 
 * Z-Index Hierarchy:
 * - Base Content: z-auto (product grid)
 * - Cart Panel: z-40
 * - Navigation: z-50 (sidebar)
 * - Action Bar: z-60 (HIGHEST - always accessible)
 * 
 * Animation Logic:
 * - Cart and Bottom Bar move in PERFECT SYNC using same spring physics
 * - Bottom bar left edge follows cart state (0 or 380px)
 * - Bottom bar right edge always respects sidebar (80px)
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
    // Cart toggle state - managed here
    const [isCartOpen, setIsCartOpen] = useState(false);

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    // Clone bottomBar to inject props
    const bottomBarWithProps = isValidElement(bottomBar)
        ? cloneElement(bottomBar, {
            ...bottomBar.props,
            onCartToggle: toggleCart,
            isCartOpen,
        } as any)
        : bottomBar;

    return (
        <div
            className={cn(
                'h-screen w-screen overflow-hidden flex',
                // LEGACY_POS_SPEC: Background gradient applied to root
                'bg-gradient-to-b from-[#023047] to-[#001219]',
                className
            )}
        >
            {/* Cart Panel - Fixed Left, z-40, w-96 (384px) */}
            <AnimatePresence mode="wait">
                {isCartOpen && (
                    <motion.div
                        initial={{ x: -384 }}
                        animate={{ x: 0 }}
                        exit={{ x: -384 }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 300
                        }}
                        className="fixed left-0 top-0 h-screen w-96 z-40"
                    >
                        {cartPanel}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area - Scrollable, adjusts margin when cart is open */}
            <motion.div
                animate={{
                    marginLeft: isCartOpen ? '380px' : '0px'
                }}
                transition={{
                    type: 'spring',
                    damping: 30,
                    stiffness: 300
                }}
                className="flex-1 min-h-screen pr-20"
            >
                {/* Screen Padding per spec: pt-6, pb-24 (action bar clearance), px-4 */}
                <div className="pt-6 px-4 pb-24 h-full">
                    {productBrowser}
                </div>
            </motion.div>

            {/* Main Navigation Sidebar - Fixed Right, z-50 */}
            <div className="z-50">
                {navigation}
            </div>

            {/* POS Action Bar - Floating Container with Animated Position, z-60 (HIGHEST) */}
            <motion.div
                animate={{
                    left: isCartOpen ? '380px' : '0px'
                }}
                transition={{
                    type: 'spring',
                    damping: 30,      // SAME as cart for perfect sync
                    stiffness: 300
                }}
                className="fixed bottom-0 right-[80px] h-[72px] z-60"
                style={{ willChange: 'left' }} // Performance hint
            >
                {bottomBarWithProps}
            </motion.div>
        </div>
    );
}
