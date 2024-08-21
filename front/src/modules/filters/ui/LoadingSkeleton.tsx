import React from 'react';
import { Skeleton } from '@/shared/ui/components/ui/skeleton';

const LoadingSkeleton: React.FC = () => (
    <div className="flex items-center space-x-4">
        <Skeleton className="h-[40px] w-[95px]" />
        <Skeleton className="h-[40px] w-[80px]" />
        <Skeleton className="h-[40px] w-[50px]" />
    </div>
);

export default LoadingSkeleton;