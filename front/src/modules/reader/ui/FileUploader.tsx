import React from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/ui/card';
import { Upload, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    loading?: boolean;
    error?: string;
    title: string;
    acceptedFileTypes: Record<string, string[]>;
    maxFiles?: number;
    maxSize?: number;
    icon?: React.ReactNode;
    dragActiveText?: string;
    dragInactiveText?: string;
    loadingText?: string;
    className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
    onFileSelect,
    loading,
    error,
    title,
    acceptedFileTypes,
    maxFiles = 1,
    maxSize,
    icon = <Upload className="mx-auto h-12 w-12 text-gray-400" />,
    dragActiveText = 'Отпустите файл здесь...',
    dragInactiveText = 'Перетащите файл сюда или кликните для выбора',
    loadingText = 'Загрузка и обработка файла...',
    className,
}) => {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

    const dropzoneOptions: DropzoneOptions = {
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                setSelectedFile(file);
                onFileSelect(file);
            }
        },
        accept: acceptedFileTypes,
        multiple: maxFiles > 1,
        maxFiles,
        maxSize,
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

    // Extract accepted file extensions
    const acceptedExtensions = Object.values(acceptedFileTypes).flat().join(', ');


    return (
        <Card className={cn('mb-4 relative', className)}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                    <span className="text-sm ">Accepted: {acceptedExtensions}</span>
                </div>
            </CardHeader>
            <CardContent>
                <div
                    {...getRootProps()}
                    className={` border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ease-in-out cursor-pointer ${
                        isDragActive
                            ? 'border-blue-500 bg-blue-50'
                            : selectedFile
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                    <input {...getInputProps()} />
                    {selectedFile ? (
                        <div className="flex items-center justify-center w-[400px]">
                            <FileText className="h-8 w-8 text-green-600" />
                            <p className="ml-2 text-green-600">{selectedFile.name}</p>
                        </div>
                    ) : (
                        <>
                            {icon}
                            <p className="mt-2 text-sm text-gray-600 w-[400px] text-center">{isDragActive ? dragActiveText : dragInactiveText}</p>
                        </>
                    )}
                </div>
                {loading && <p className="text-blue-500 mt-6 absolute right-1/4 -bottom-8">{loadingText}</p>}
                {error && error !== 'No file selected' && (
                    <div className="flex items-center text-red-500 mt-4">
                        <AlertCircle className="mr-2" />
                        <span>{error}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
