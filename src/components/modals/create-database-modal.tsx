import { FileSelectionType, openFilePicker } from "@decky/api";
import { Button, ModalRoot, ModalRootProps, TextField } from "@decky/ui";
import { useState } from "react";
import { ButtonItemIconContent, ModalContent } from "../shared";
import { FaFolder, FaPlus } from "react-icons/fa";
import { PasswordInput } from "../password-input";

export interface CreateDatabaseModalProps extends ModalRootProps {
    onCreateDatabase: (databasePath: string, password: string) => Promise<void>;
}

export const CreateDatabaseModal = (props: CreateDatabaseModalProps) => {

    const [title, setTitle] = useState<string>('');
    const [saveFolder, setSaveFolder] = useState<string | null>(null);
    const [password, setPassword] = useState<string>('');

    const onSetTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        if (/^[a-zA-Z0-9\s]*$/.test(newValue)) {
            setTitle(newValue);
        }
    }

    const databasePath = `${saveFolder}/${title}.kdbx`;

    const onSelectFolder = async () => {
        await openFilePicker(
            FileSelectionType.FOLDER,
            '/home/deck', false, true).then(async res => {
                setSaveFolder(res.path);
            });
    }

    const canConfirm = !!saveFolder && !!title && !!password;

    const onConfirm = async () => {
        await props.onCreateDatabase(databasePath, password);
    };

    return <ModalRoot onCancel={() => { props.closeModal?.() }}>
        <ModalContent icon={<FaPlus />} title="Create Database"
            onConfirm={onConfirm}
            canConfirm={canConfirm}
            closeModal={() => { props.closeModal?.() }}>
            {(isLoading) => <>
            
                <TextField
                    label="Database name"
                    value={title}
                    onChange={onSetTitle}
                />

                <Button
                    disabled={isLoading}
                    style={{ marginBottom: '20px' }}
                    className="DialogButton"
                    onClick={onSelectFolder}>
                    <ButtonItemIconContent justifyContent="center" icon={<FaFolder />}
                    >Select Save Folder</ButtonItemIconContent></Button>


                <div style={{ marginBottom: '40px' }}>
                    Database will be stored at: {!!title && !!saveFolder ? databasePath : 'Not set'}
                </div>

                <PasswordInput
                    label="Database Password"
                    value={password}
                    bIsPassword={true}
                    disabled={isLoading}
                    onChange={e => setPassword(e.target.value)}>
                </PasswordInput>

            </>}
        </ModalContent>
    </ModalRoot >
}