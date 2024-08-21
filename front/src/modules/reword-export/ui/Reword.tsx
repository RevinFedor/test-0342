import React, { useState } from 'react';
import axios from 'axios';
import { Input } from '@/shared/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/components/ui/select';
import { Button } from '@/shared/ui/components/ui/button';
import { useToast } from '@/shared/ui/components/ui/use-toast';
import { FileUploader } from '@/modules/reader/ui/FileUploader';

const Reword = () => {
    const [file, setFile] = useState<File | null>(null);
    const [ыfile, ыsetFile] = useState<{
        name: string;
        age: number;
        email: string;
    }>(null);
    const [format, setFormat] = useState('text');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast(); // Use the useToast hook

    const onFileChange = (file: File) => {
        setFile(file);
    };

    const onFormatChange = (value: string) => {
        setFormat(value);
    };

    const onUpload = async () => {
        if (!file) {
            toast({
                title: 'Error',
                description: 'Please select a file first.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', format);

        try {
            toast({
                title: 'Uploading...',
                description: 'Your file is being uploaded.',
                variant: 'default',
                duration: 1000,
            });

            const response = await axios.post('http://localhost:3500/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob',
            });

            // Create URL for file download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'exported_words.txt'); // File name
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: 'Success',
                description: 'File downloaded successfully.',
                variant: 'success',
                duration: 1000,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error uploading file.',
                variant: 'destructive',
                duration: 1000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4 p-4">
            {/* <Input type="file" onChange={(e) => e.target.files && onFileChange(e.target.files[0])} accept=".backup" className="w-full max-w-xs" /> */}
            <FileUploader
                onFileSelect={onFileChange}
                error={file ? '' : 'No file selected'}
                title="Upload ReWord File "
                acceptedFileTypes={{ 'application/backup': ['.backup'] }}
            />
            <Select value={format} onValueChange={onFormatChange} className="w-full max-w-xs">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="text">Wors-Transelte</SelectItem>
                    <SelectItem value="csv">Words Array</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={onUpload} disabled={!file} className="w-full max-w-xs">
                Upload
            </Button>
        </div>
    );
};

export default Reword;
