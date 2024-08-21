import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/components/ui/button';
import { Alert, AlertDescription } from '@/shared/ui/components/ui/alert';
import BookUpload from './BookUpload';

const Library = () => {
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.type === 'application/epub+zip') {
                onAddBook(file);
                setAlertMessage('Book added successfully!');
                setIsAlertVisible(true);
            } else {
                setAlertMessage('Please select an EPUB file.');
                setIsAlertVisible(true);
            }
        }
    };

    const onAddBook = (file) => {
        // Handle the new book file, e.g., upload to server or add to state
        console.log('New book added:', file.name);
    };

    return (
        <div className="container mx-auto p-4 flex flex-col items-start">
            <h1 className="text-2xl font-bold mb-4">My Library</h1>
            {/* Your existing book grid */}
            <div className="mt-4">
                <div className="relative">
                    <input type="file" accept=".epub" onChange={handleFileChange} className="hidden" id="book-input" />
                    <label htmlFor="book-input">
                        <Button className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                            <Plus className="mr-2" size={16} />
                            Add Book
                        </Button>
                    </label>
                    {isAlertVisible && (
                        <Alert className="mt-4 absolute top-full left-0 right-0">
                            <AlertDescription>{alertMessage}</AlertDescription>
                        </Alert>
                    )}
                    <BookUpload />
                </div>
            </div>
        </div>
    );
};

export default Library;
