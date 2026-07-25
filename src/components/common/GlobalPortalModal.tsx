import React from "react";
import { 
  AfriModal, 
  AndroidBottomSheet as AfriBottomSheet, 
  AndroidCenteredDialog as AfriCenteredDialog,
  useBodyScrollLock as AfriUseBodyScrollLock,
  AfriModalProps
} from "./AfriModal";

export { 
  AfriModal, 
  ModalProvider, 
  useModal, 
  useBodyScrollLock 
} from "./AfriModal";

/**
 * GlobalPortalModal - Re-exporting legacy components backed by the unified AfriModal system
 */
export const AndroidBottomSheet: React.FC<AfriModalProps> = (props) => (
  <AfriBottomSheet {...props} />
);

export const AndroidCenteredDialog: React.FC<AfriModalProps> = (props) => (
  <AfriCenteredDialog {...props} />
);
