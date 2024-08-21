import { ArrowLeft, ArrowRight } from 'lucide-react';
import React from 'react';

export const Labels = ({}) => {
    return (
        <div>
            {/* Labels and Numbering */}
            <div className="absolute -top-16 left-1/4 transform -translate-x-1/2 text-navy-600 flex items-center">
                <span className="text-lg font-semibold mr-2">Weeks of the Year</span>
                <ArrowRight className="w-6 h-6" />
            </div>
            <div className="absolute -left-24 top-1/4 transform -translate-y-1/2 -rotate-90 text-navy-600 flex items-center">
                <ArrowLeft className="w-6 h-6 mr-2" />
                <span className="text-lg font-semibold">Age</span>
            </div>
            {/* Week numbers */}
            <div className="absolute -top-6 w-full">
                <div className="grid grid-cols-[repeat(52,minmax(0,1fr))] gap-0">
                    {Array.from({ length: 52 }, (_, i) => i + 1).map((el) => (
                        <span key={el} className="flex items-center justify-center w-3 h-3 text-[16px] text-white">
                            {el}
                        </span>
                    ))}
                </div>
            </div>
            {/* Age numbers */}
            <div className="absolute -left-5 h-full text-sm">
                <div className="h-full flex flex-col justify-between">
                    {Array.from({ length: 90 }, (_, i) => i).map((el) => (
                        <span key={el} className="flex items-center justify-center w-2 h-2 text-[14px] text-white">
                            {el}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};
