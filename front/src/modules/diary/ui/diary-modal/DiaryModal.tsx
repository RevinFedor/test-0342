import { useEffect, useState } from 'react';
import Modal from '../../../../shared/ui/Modal';
import { DiaryEntry } from '../../types/diary';
import 'react-medium-image-zoom/dist/styles.css';
import { useDeleteImageMutation, useUploadImageMutation } from '../../api/diaryApi';
import { Label } from '@/shared/ui/components/ui/label';
import { Switch } from '@/shared/ui/components/ui/switch';
import clsx from 'clsx';
import ImageGallery from '../image-gallery/ImageGallery';
import ImageUploader from '../image-gallery/ImageUploader';
import { DiaryEntryForm } from './DiaryEntryForm';

interface DiaryModalProps {
    selectedEntry: DiaryEntry | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => void;
    onUpdate: (id: string, patch: any) => void;
}

const DiaryModal = ({ selectedEntry, isOpen, onClose, onDelete, onUpdate }: DiaryModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isSwitch, setIsSwitch] = useState(false);
    const [uploadImage] = useUploadImageMutation();
    const [deleteImage] = useDeleteImageMutation();

    // обнолвение input
    useEffect(() => {
        if (file) {
            handleImageUpload();
        }
    }, [file]);

    const handleImageUpload = () => {
        if (file && selectedEntry) {
            const data = new FormData();
            data.append('file', file);

            uploadImage({ id: selectedEntry._id, data }).then(() => {
                // Clear the file after successful upload
                setFile(null);
            });
        }
    };

    const handleImageDelete = async (imageId: string) => {
        if (selectedEntry) {
            await deleteImage({ id: selectedEntry._id, imageId });
        }
    };

    return (
        <div className="relative">
            <div modal-switch="modal-switch" className={clsx('flex items-center space-x-2 outline-none fixed top-5 right-10 z-50', !isOpen && 'hidden')}>
                <Switch id="airplane-mode" checked={isSwitch} onCheckedChange={(_) => setIsSwitch(!isSwitch)} />
                <Label htmlFor="airplane-mode">Full Width</Label>
            </div>
            <Modal isOpen={isOpen} onClose={onClose} onDelete={onDelete} width={isSwitch ? '1700px' : '1000px'}>
                {selectedEntry && (
                    <div>
                        <DiaryEntryForm selectedEntry={selectedEntry} isOpen={isOpen} onUpdate={onUpdate} />
                        {/* <DiaryEntryEditor selectedEntry={selectedEntry} isOpen={isOpen} onUpdate={onUpdate} /> */}
                        <ImageGallery images={selectedEntry.images} onDelete={handleImageDelete} />
                        <ImageUploader onFileChange={setFile} />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DiaryModal;
