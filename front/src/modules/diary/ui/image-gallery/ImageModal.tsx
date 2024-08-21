import React from 'react';
import ImageZoom from 'react-medium-image-zoom';
import Modal from 'react-modal';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

Modal.setAppElement('#root'); // Устанавливает корневой элемент для управления фокусом

interface ImageModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
    imageUrl: string;
    imageAlt: string;
}

const ImageModal = ({ isOpen, onRequestClose, imageUrl, imageAlt }: ImageModalProps) => {
  // это в род компоненте
    //   const [modalIsOpen, setModalIsOpen] = useState(false);
    // const [currentImage, setCurrentImage] = useState<string>('');
    return (
        // <Modal
        //     isOpen={isOpen}
        //     onRequestClose={onRequestClose}
        //     contentLabel="Image Modal"
        //     className="relative max-w-[90vw] max-h-[800px] mx-auto bg-white rounded-lg p-5 overflow-hidden z-[1050] flex items-center justify-center"
        //     overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1040]"
        // >
        //     <button onClick={onRequestClose} className="absolute top-2 right-2 text-white text-2xl font-bold border-none bg-transparent cursor-pointer">
        //         &times;
        //     </button>
        //     <div className="flex justify-center items-center w-full h-full">
        //         <img src={imageUrl} alt={imageAlt} className="max-w-full max-h-full " />
        //     </div>
        // </Modal>

        <>
            {' '}
            
        </>
    );
};

export default ImageModal;
