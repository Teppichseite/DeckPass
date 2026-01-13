import { ModalRoot, ModalRootProps } from "@decky/ui";
import { useState } from "react";
import { ModalContent } from "../shared";
import { PasswordInput } from "../password-input";
import { FaLockOpen } from "react-icons/fa";

export interface OpenDatabaseModal extends ModalRootProps {
    onOpen: (password: string) => Promise<void>;
}

export const OpenDatabaseModal = (props: OpenDatabaseModal) => {

    const [password, setPassword] = useState<string>('');

    const onConfirm = async () => {
        await props.onOpen(password);
    }

    return <ModalRoot onCancel={() => { props.closeModal?.() }}>
        <ModalContent
            icon={<FaLockOpen />}
            title="Unlock Database"
            onConfirm={onConfirm}
            canConfirm={true}
            closeModal={props.closeModal}>
            {(isLoading) =>
                <PasswordInput
                    disabled={isLoading}
                    value={password}
                    bIsPassword={true}
                    onChange={e => setPassword(e.target.value)}>
                </PasswordInput>}
        </ModalContent>
    </ModalRoot>
};