import React from 'react';
import { Input } from '@/shared/ui/components/ui/input';
import { Label } from '@/shared/ui/components/ui/label';

interface ImageUploaderProps {
    onFileChange: (file: File | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileChange }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFileChange(e.target.files?.[0] || null);
    };

    return (
        <div className="mt-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="picture">Upload Image</Label>
                <Input
                    id="picture"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="bg-black text-white cursor-pointer"
                    placeholder="Select image"
                />
            </div>
        </div>
    );
};

export default ImageUploader
