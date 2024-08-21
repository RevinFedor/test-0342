import React from 'react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { DiaryEntry } from '../../types/diary';

interface ImageGalleryProps {
    images: DiaryEntry['images'];
    onDelete: (imageId: string) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onDelete }) => {
    return (
        <div className="mt-4 flex flex-wrap gap-5 overflow-y-auto">
            {images.map((image) => (
                <div key={image.id} className="relative group">
                    <Zoom>
                        <img
                            src={`http://localhost:3500${image.path}`}
                            alt={image.fileName}
                            className="w-[200px] h-full object-cover cursor-pointer"
                        />
                    </Zoom>
                    <button
                        className="hidden group-hover:block absolute top-0 right-0 bg-red-600 text-white p-1 rounded-lg w-8 h-8"
                        onClick={() => onDelete(image._id)}
                    >
                        X
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ImageGallery;
