// FileUploader.tsx
import React, { useEffect } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/ui/card';
import { Upload, AlertCircle, FileText, Loader2 } from 'lucide-react';
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
    resetTrigger?: any;
    size?: 'small' | 'medium' | 'large'; // Определяем размер как строковые литералы
}

const sizeClasses = {
    small: {
        container: 'w-64 h-40',
        icon: 'h-8 w-8',
        text: 'text-sm',
    },
    medium: {
        container: 'w-96 h-40',
        icon: 'h-12 w-12',
        text: 'text-base',
    },
    large: {
        container: 'w-full h-40',
        icon: 'h-16 w-16',
        text: 'text-lg',
    },
};

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
    resetTrigger,
    size = 'large', // Значение по умолчанию
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

    // Извлекаем допустимые расширения файлов
    const acceptedExtensions = Object.values(acceptedFileTypes).flat().join(', ');

    // Функция для форматирования размера файла
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Сбрасываем выбранный файл при изменении resetTrigger
    useEffect(() => {
        if (resetTrigger) {
            setSelectedFile(null);
        }
    }, [resetTrigger]);

    // Получаем классы для выбранного размера
    const currentSizeClasses = sizeClasses[size] || sizeClasses['large'];

    return (
        <Card className={cn('relative', className)}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                    <span className="text-sm">Accepted: {acceptedExtensions}</span>
                </div>
            </CardHeader>
            <CardContent>
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ease-in-out cursor-pointer ${currentSizeClasses.container} ${
                        isDragActive
                            ? 'border-blue-500 bg-blue-50'
                            : selectedFile
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                    <input {...getInputProps()} />
                    {loading ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className={`animate-spin text-blue-500 ${currentSizeClasses.icon}`} />
                            <p className={`mt-2 ${currentSizeClasses.text} text-blue-500`}>{loadingText}</p>
                        </div>
                    ) : selectedFile ? (
                        <div className="flex flex-col items-center">
                            <FileText className={`text-green-600 ${currentSizeClasses.icon}`} />
                            <p className={`mt-2 ${currentSizeClasses.text} text-green-600`}>{selectedFile.name}</p>
                            <p className={`text-sm ${currentSizeClasses.text} text-green-600`}>{formatFileSize(selectedFile.size)}</p>
                        </div>
                    ) : (
                        <>
                            {icon}
                            <p className={`mt-2 ${currentSizeClasses.text} text-gray-600`}>
                                {isDragActive ? dragActiveText : dragInactiveText}
                            </p>
                        </>
                    )}
                </div>
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
