import React, { ChangeEvent, FocusEvent, useState, useEffect } from 'react';
import { DobState } from '../model/types';
import { CalendarForm } from '@/shared/ui/CalendarForm';
import { Input } from '@/shared/ui/components/ui/input';

interface SelectProps {
    dob: DobState;
    setDob: React.Dispatch<React.SetStateAction<DobState>>;
}

export const Select = ({ dob, setDob }: SelectProps) => {
    const [localDob, setLocalDob] = useState(dob);
    const { month, day, year } = dob;
    const initialDate = new Date(Number(year), Number(month) - 1, Number(day));

    useEffect(() => {
        setLocalDob(dob);
    }, [dob]);

    // Handler for select onChange
    const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>): void => {
        const { name, value } = e.target;
        setDob((prev) => ({ ...prev, [name]: value }));
    };

    // Handler for input onChange (updates local state)
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setLocalDob((prev) => ({ ...prev, [name]: value }));
    };

    // Handler for input onBlur (updates main state)
    const handleInputBlur = (e: FocusEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setDob((prev) => ({ ...prev, [name]: value }));
    };

    // Calendar handler
    const handleDateChange = (date: Date): void => {
        const newDob = {
            year: date.getFullYear().toString(),
            month: (date.getMonth() + 1).toString(),
            day: date.getDate().toString(),
        };
        setDob(newDob);
    };

    return (
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-navy-600 mr-2 text-center">Your Life in Weeks</h1>
            <p className="mb-2">Date of Birth</p>
            <div className="flex items-center justify-center">
                {' '}
                <select name="month" value={dob.month} onChange={handleSelectChange} className="mr-2 p-1 border rounded">
                    <option value="">Month</option>
                    {[...Array(12)].map((_, i) => (
                        <option key={i} value={i + 1}>
                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                    ))}
                </select>
                <Input
                    type="text"
                    name="day"
                    value={localDob.day}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="Day"
                    className="w-16 mr-2 p-1 border rounded"
                />
                <Input
                    type="text"
                    name="year"
                    value={localDob.year}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="Year"
                    className="w-20 p-1 border rounded"
                />
            </div>

            <CalendarForm initialDate={initialDate} className="mt-5" onDateChange={handleDateChange} />
        </div>
    );
};
