import { Button, ModalRoot, ModalRootProps, TextField } from "@decky/ui";
import { useState } from "react";
import { PasswordInput } from "../password-input";
import { CurrentEntryDetails, Entry } from "../../interfaces";
import { ButtonItemIconContent, ModalContent } from "../shared";
import { FaEdit, FaPlus, FaRandom } from "react-icons/fa";

export type EntryModalProps = ModalRootProps & {
  onGenerateRandomPassword: () => Promise<string>;
  currentEntries: Entry[] | null;
} & (
    | {
        mode: "create";
        onCreateEntry: (
          title: string,
          username: string,
          password: string
        ) => Promise<void>;
      }
    | {
        mode: "edit";
        entry: Entry;
        entryDetails: CurrentEntryDetails;
        onEditEntry: (
          title: string,
          newTitle: string,
          username: string,
          password: string
        ) => Promise<void>;
      }
  );

export const EntryModal = (props: EntryModalProps) => {
  const initialValues =
    props.mode === "edit"
      ? {
          title: props.entry.title,
          username: props.entryDetails.username,
          password: props.entryDetails.password,
        }
      : {
          title: "",
          username: "",
          password: "",
        };

  const [title, setTitle] = useState<string>(initialValues.title);
  const [username, setUsername] = useState<string>(initialValues.username);
  const [password, setPassword] = useState<string>(initialValues.password);

  const isTitleValid = (title: string) => /^[a-zA-Z0-9\s_-]*$/.test(title);

  const onSetTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (isTitleValid(newValue)) {
      setTitle(newValue);
    }
  };

  const titleExists =
    props.mode === "create" &&
    props.currentEntries?.some((entry) => entry.title === title);

  const onConfirm = async () => {
    if (props.mode === "create") {
      await props.onCreateEntry(title, username, password);
    } else {
      await props.onEditEntry(initialValues.title, title, username, password);
    }
  };

  const onGenerateRandomPassword = async () => {
    const randomPassword = await props.onGenerateRandomPassword();
    console.log(randomPassword);
    setPassword(randomPassword);
  };

  const canSave = () => {
    if (props.mode === "create") {
      return title.length > 0;
    }

    if (title !== initialValues.title) {
      return true;
    }

    if (username !== initialValues.username) {
      return true;
    }

    if (password !== initialValues.password) {
      return true;
    }

    return false;
  };

  return (
    <ModalRoot
      onCancel={() => {
        props.closeModal?.();
      }}
    >
      <ModalContent
        icon={props.mode === "create" ? <FaPlus /> : <FaEdit />}
        title={
          props.mode === "create" ? "Create Entry" : `Edit Entry ${initialValues.title}`
        }
        onConfirm={onConfirm}
        canConfirm={canSave() && !titleExists}
        closeModal={props.closeModal}
      >
        {(isLoading) => (
          <>
            <div>
              <TextField
                label="Title"
                value={title}
                disabled={isLoading || !isTitleValid(title)}
                onChange={onSetTitle}
              />

              {titleExists && (
                <div style={{ marginBottom: "20px" }}>
                  Entry with same title already exists!
                </div>
              )}

              <TextField
                label="Username"
                value={username}
                disabled={isLoading}
                onChange={(e) => setUsername(e.target.value)}
              />

              <PasswordInput
                label="Password"
                value={password}
                bIsPassword={true}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
              ></PasswordInput>
            </div>
            <Button
              style={{ marginBottom: "20px" }}
              className="DialogButton"
              disabled={isLoading}
              onClick={onGenerateRandomPassword}
            >
              <ButtonItemIconContent justifyContent="center" icon={<FaRandom />}>
                Generate Random Password
              </ButtonItemIconContent>
            </Button>
          </>
        )}
      </ModalContent>
    </ModalRoot>
  );
};
