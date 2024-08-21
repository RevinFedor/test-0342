import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ePub from 'epubjs';
import { Card, CardContent } from '@/shared/ui/components/ui/card';
import { Button } from '@/shared/ui/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/components/ui/sheet';
import { ScrollArea } from '@/shared/ui/components/ui/scroll-area';
import { Input } from '@/shared/ui/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useGetBooksQuery, useUploadBookMutation, useDeleteBookMutation } from '../model/booksApiSlice';

interface Book {
    _id: string;
    filePath: string;
    title?: string;
}

const BookUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const { data: books, isLoading: isBooksLoading, error: booksError } = useGetBooksQuery();
    const [uploadBook, { isLoading: isUploading }] = useUploadBookMutation();
    const [deleteBook] = useDeleteBookMutation();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('book', file);
        await uploadBook(formData);
        setFile(null);
    };

    const handleDelete = async (id: string) => {
        await deleteBook(id);
        setIsDrawerOpen(false);
        setSelectedBook(null);
    };

    const handleBookClick = (book: Book) => {
        setSelectedBook(book);
        setIsDrawerOpen(true);
    };

    const BookCover = useCallback(({ filePath, title }: { filePath: string; title: string }) => {
        const [coverUrl, setCoverUrl] = useState<string | null>(null);

        React.useEffect(() => {
            const loadCover = async () => {
                try {
                    const response = await fetch(`http://localhost:3500${filePath}`);
                    const arrayBuffer = await response.arrayBuffer();
                    const book = ePub(arrayBuffer);
                    await book.ready;
                    const cover = await book.coverUrl();
                    setCoverUrl(cover);
                } catch (error) {
                    console.error('Error loading book cover:', error);
                }
            };
            loadCover();
        }, [filePath]);

        if (coverUrl) {
            return <img src={coverUrl} alt={title} className="w-full h-48 object-cover mb-2" />;
        } else {
            return (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center mb-2">
                    <span className="text-sm text-gray-500 text-center px-2">{title}</span>
                </div>
            );
        }
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">My Library</h1>
            <div className="mb-4 flex items-center gap-2">
                <Input type="file" onChange={handleFileChange} accept=".epub" />
                <Button onClick={handleUpload} disabled={!file || isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Upload
                </Button>
            </div>
            {booksError && <p className="text-red-500 mb-4">Failed to fetch books. Please try again.</p>}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {isBooksLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                    books?.map((book) => (
                        <Card key={book._id} className="cursor-pointer">
                            <CardContent className="p-4">
                                <div onClick={() => handleBookClick(book)}>
                                    <BookCover filePath={book.filePath} title={book.title || 'Unknown Title'} />
                                    <p className="text-sm truncate">{book.title || book.filePath.split('/').pop()}</p>
                                </div>
                                <Link to={`/Library/${book._id}`} className="mt-2 block text-blue-500 hover:underline">
                                    Open book
                                </Link>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <SheetContent>
                    {selectedBook ? (
                        <>
                            <SheetHeader>
                                <SheetTitle>{selectedBook.title || 'Unknown Title'}</SheetTitle>
                                <SheetDescription>{selectedBook.filePath}</SheetDescription>
                            </SheetHeader>
                            <ScrollArea className="h-[calc(100vh-200px)] mt-4">
                                <BookCover filePath={selectedBook.filePath} title={selectedBook.title || 'Unknown Title'} />
                                {/* Здесь может быть дополнительная информация о книге */}
                            </ScrollArea>
                            <div className="flex justify-between mt-4">
                                <a href={`http://localhost:3500${selectedBook.filePath}`} target="_blank" rel="noopener noreferrer">
                                    <Button>Download</Button>
                                </a>
                                <Button variant="destructive" onClick={() => handleDelete(selectedBook._id)}>
                                    Delete
                                </Button>
                            </div>
                        </>
                    ) : null}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default BookUpload;
