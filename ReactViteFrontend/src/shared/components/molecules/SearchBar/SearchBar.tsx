import * as React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/shared/components/atoms/Input';
import { Button } from '@/shared/components/atoms/Button';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
    /** Current search value */
    value?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Search change callback */
    onSearch: (value: string) => void;
    /** Optional filter button callback */
    onFilterClick?: () => void;
    /** Show filter button */
    showFilter?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * SearchBar Molecule
 * Combination of Input with Search icon + optional Filter button
 * 
 * Features:
 * - Search icon (start)
 * - Optional filter button (end)
 * - Debounced search (handled by parent or internally)
 * 
 * @example
 * <SearchBar 
 *   placeholder="ابحث عن منتج..."
 *   onSearch={(value) => setSearchTerm(value)}
 *   showFilter
 *   onFilterClick={() => setShowFilters(true)}
 * />
 */
export function SearchBar({
    value,
    placeholder = 'ابحث...',
    onSearch,
    onFilterClick,
    showFilter = false,
    className,
}: SearchBarProps) {
    const [searchValue, setSearchValue] = React.useState(value || '');

    // Debounce search (300ms)
    const debounceTimeoutRef = React.useRef<NodeJS.Timeout>();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchValue(newValue);

        // Clear previous timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set new timeout
        debounceTimeoutRef.current = setTimeout(() => {
            onSearch(newValue);
        }, 300);
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {/* Search Input */}
            <div className="flex-1">
                <Input
                    value={searchValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    startIcon={<Search className="h-4 w-4" />}
                    inputSize="lg"
                />
            </div>

            {/* Filter Button (Optional) */}
            {showFilter && onFilterClick && (
                <Button
                    variant="outline"
                    size="lg"
                    className="h-14 w-14 p-0"
                    onClick={onFilterClick}
                >
                    <SlidersHorizontal className="h-5 w-5" />
                </Button>
            )}
        </div>
    );
}
