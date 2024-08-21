import React, { useEffect, useState } from 'react';

const EditableDate = ({ initialDate, onDateChange }: any) => {
    const [editMode, setEditMode] = useState(false);
    const [date, setDate] = useState(initialDate);

    const formatDate = (dateString: any) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
           
            return '';
        }
        return date.toISOString().split('T')[0];
    };
    const formattedInitialDate = formatDate(initialDate);

    const handleDateChange = (event: any) => {
        event.stopPropagation();
        setDate(event.target.value);
        onDateChange(event.target.value);
    };
    // Выйти из режима редактирование при нажатие на "Escape"
    useEffect(() => {
        const handleEscape = (event: any) => {
            if (event.key === 'Escape') {
                setEditMode(false);
            }
        };

        if (editMode) {
            document.addEventListener('keydown', handleEscape);
        } else {
            document.removeEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [editMode]);

    return (
        <div onClick={(e) => e.stopPropagation()}>
            {editMode ? (
                <input
                    type="date"
                    value={formattedInitialDate}
                    onChange={handleDateChange}
                    onBlur={() => setEditMode(false)}
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
                    autoFocus
                    className="bg-gray-800   border border-gray-600 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-gray-600"
                />
            ) : (
                <p
                    onClick={(event) => {
                        event.stopPropagation();
                        setEditMode(true);
                    }}
                    className="cursor-pointer ml-4 hover:scale-110 hover:ml-6 transition-all  p-1 rounded"
                >
                    {new Date(date).toLocaleDateString()}
                </p>
            )}
        </div>
    );
};

export default EditableDate;
