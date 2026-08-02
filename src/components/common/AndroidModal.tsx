import React from 'react';
import { AndroidBottomSheet, AndroidBottomSheetProps } from './AndroidBottomSheet';
import { AfriModal } from './AfriModal';

export interface AndroidModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const AndroidModal: React.FC<AndroidModalProps> = (props) => {
  return <AndroidBottomSheet {...props} />;
};

export { AndroidBottomSheet };
export type { AndroidBottomSheetProps };
export default AndroidModal;


