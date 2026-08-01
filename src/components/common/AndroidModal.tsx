import React from 'react';
import { AfriModal } from './AfriModal';

interface AndroidModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const AndroidModal: React.FC<AndroidModalProps> = ({ isOpen, onClose, title, children, className }) => {
  return (
    <AfriModal
      isOpen={isOpen}
      onClose={onClose}
      type="bottom_sheet"
      title={title}
      className={className}
    >
      {children}
    </AfriModal>
  );
};

export default AndroidModal;

