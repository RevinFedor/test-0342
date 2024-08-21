import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUpdateDiaryEntryMutation, useDeleteDiaryEntryMutation, useGetDiaryEntryByIdQuery, useUploadImageMutation, useDeleteImageMutation } from '../api/diaryApi';
import { DiaryEntry } from '../types/diary';

import ImageGallery from './image-gallery/ImageGallery';
import ImageUploader from './image-gallery/ImageUploader';
import { useNavigate } from 'react-router-dom';
import { DiaryEntryForm } from './diary-modal/DiaryEntryForm';

const DiaryEntryPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);

    const { data: entry, isLoading, error } = useGetDiaryEntryByIdQuery(id as string);
    const [updateDiaryEntry] = useUpdateDiaryEntryMutation();
    const [deleteDiaryEntry] = useDeleteDiaryEntryMutation();
    const [uploadImage] = useUploadImageMutation();
    const [deleteImage] = useDeleteImageMutation();

    useEffect(() => {
        if (file) {
            handleImageUpload();
        }
    }, [file]);

    const handleUpdate = async (id: string, patch: Partial<DiaryEntry>) => {
        if (id) {
            try {
                await updateDiaryEntry({ id, data: patch }).unwrap();
            } catch (error) {
                console.error('Failed to update diary entry:', error);
            }
        }
    };

    const handleDelete = async () => {
        if (id) {
            try {
                await deleteDiaryEntry(id).unwrap();
                navigate('/diary'); // Redirect to the main diary page after deletion
            } catch (error) {
                console.error('Failed to delete diary entry:', error);
            }
        }
    };

    const handleImageUpload = async () => {
        if (file && id) {
            const data = new FormData();
            data.append('file', file);
            try {
                await uploadImage({ id, data }).unwrap();
                setFile(null);
            } catch (error) {
                console.error('Failed to upload image:', error);
            }
        }
    };

    const handleImageDelete = async (imageId: string) => {
        if (id) {
            try {
                await deleteImage({ id, imageId }).unwrap();
            } catch (error) {
                console.error('Failed to delete image:', error);
            }
        }
    };

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.toString()}</p>;
    if (!entry) return <p>Entry not found</p>;

    return (
        <div className="container mx-auto p-4">
            <DiaryEntryForm selectedEntry={entry} isOpen={true} onUpdate={handleUpdate} />
            <ImageGallery images={entry.images} onDelete={handleImageDelete} />
            <ImageUploader onFileChange={setFile} />
            <button onClick={handleDelete} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
                Delete Entry
            </button>
        </div>
    );
};

export default DiaryEntryPage;
