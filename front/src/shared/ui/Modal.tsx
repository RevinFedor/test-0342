import clsx from 'clsx';
import React, { useEffect, useRef, useCallback } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete?: () => void;
    children: React.ReactNode;
    width?: string; // Ширина модального окна
    height?: string; // Высота модального окна
    className?: string; // Высота модального окна
}

const Modal = ({ isOpen, onClose, children, onDelete, width = '1000px', height = '800px', className }: ModalProps) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const modalIsOpen = useRef(isOpen); // Глобальный флаг для отслеживания статуса модального окна

    useEffect(() => {
        modalIsOpen.current = isOpen; // Обновляем флаг при каждом изменении isOpen
    }, [isOpen]);

    const checkIfClickedOutside = useCallback(
        (e: any) => {
            if (
                ref.current &&
                !ref.current.contains(e.target) &&
                !e.target.closest('[data-radix-popper-content-wrapper]') &&
                !e.target.closest('[data-rmiz-modal]') &&
                !e.target.closest('[modal-switch]')
            ) {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        document.addEventListener('mousedown', checkIfClickedOutside);
        return () => {
            document.removeEventListener('mousedown', checkIfClickedOutside);
        };
    }, [checkIfClickedOutside]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed z-10 inset-0  text-white ">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div onClick={onClose} className="fixed inset-0 transition-opacity">
                    <div className="absolute inset-0 bg-black opacity-85"></div>
                </div>
                //! Окно
                <div
                    ref={ref}
                    style={{
                        width,
                        height,
                    }}
                    className={clsx(
                        'modal_content m-auto flex flex-col justify-between align-middle mt-10  bg-[#020617] rounded-lg text-left overflow-y-auto shadow-xl transform transition-all ',
                        className
                    )}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-headline"
                >
                    <div className="bg-[#242424]px-4 pt-5 pb-4 sm:p-6 sm:pb-4">{children}</div>
                    <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onDelete}
                        >
                            Удалить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
