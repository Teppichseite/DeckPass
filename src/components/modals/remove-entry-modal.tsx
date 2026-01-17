import { ModalRoot, ModalRootProps } from "@decky/ui";
import { Entry } from "../../interfaces";
import { ModalContent } from "../shared";
import { FaTrash } from "react-icons/fa";

export interface RemoveEntryModalProps extends ModalRootProps {
  entry: Entry;
  onRemoveEntry: () => Promise<void>;
}

export const RemoveEntryModal = (props: RemoveEntryModalProps) => {
  const onConfirm = async () => {
    await props.onRemoveEntry();
  };

  return (
    <ModalRoot
      onCancel={() => {
        props.closeModal?.();
      }}
    >
      <ModalContent
        icon={<FaTrash />}
        title="Remove Entry"
        onConfirm={onConfirm}
        canConfirm={true}
        closeModal={props.closeModal}
      >
        {() => <>Are you sure you want to remove {props.entry.title}?</>}
      </ModalContent>
    </ModalRoot>
  );
};
