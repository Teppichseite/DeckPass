import { ButtonItem, DialogButton, Field, findSP, Focusable, showModal } from "@decky/ui";
import { FaCaretDown, FaCaretRight, FaUser, FaKey, FaEye, FaFolder, FaEyeSlash, FaInfoCircle, FaEdit, FaTrash, FaBolt } from "react-icons/fa";
import { usePasswordManagerContext } from "../context";
import { Entry } from "../interfaces";
import { ButtonContentOverflow, ButtonItemIconContent } from "./shared";
import { useEffect, useRef } from "react";
import { EntryModal } from "./modals/entry-modal";
import { RemoveEntryModal } from "./modals/remove-entry-modal";

interface DetailDescriptionProps {
  children?: React.ReactNode;
}

const DetailDescription = ({ children }: DetailDescriptionProps) =>
  children ? <div style={{
    fontSize: '15px',
    overflowWrap: 'break-word',
    paddingTop: '10px',
    whiteSpace: 'pre-wrap'
  }}>{children}</div>
    : undefined;

export const PastingInstructions = () => {
  return <DetailDescription>
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', marginTop: '5px' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FaInfoCircle size={18} />
      </div>
      <div style={{ flex: 4 }}>
        <strong>Select</strong> an input field <strong>before</strong> clicking on the paste button.
      </div>
    </div>
  </DetailDescription>
}

export interface EntryComponentProps {
  entry: Entry;
}

export const EntryComponent = (props: EntryComponentProps) => {

  const { toggleCurrentEntry, currentEntry } = usePasswordManagerContext();

  const isCurrentEntry = currentEntry?.path === props.entry.path;

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    if (isCurrentEntry) {
      ref.current.scrollIntoView();
      const buttonItem = ref.current.querySelector('button')
      buttonItem?.focus();
    }
  }, [isCurrentEntry, ref, ref.current]);

  return <div>
    <ButtonContentOverflow>
      <div ref={ref}>
        <ButtonItem
          layout="below"
          onClick={() => {
            if (isCurrentEntry) {
              toggleCurrentEntry(null, 'copy');
              return;
            }

            toggleCurrentEntry(props.entry, 'copy');
          }}
          label={props.entry.folderPath}
          icon={props.entry.folderPath ? <FaFolder /> : undefined}
          description={isCurrentEntry
            ? <PastingInstructions />
            : undefined}
        >
          <ButtonItemIconContent
            icon={isCurrentEntry ? <FaCaretDown /> : <FaCaretRight />}
          >{props.entry.title}</ButtonItemIconContent>
        </ButtonItem>
      </div>
    </ButtonContentOverflow>
    {isCurrentEntry && <EntryContent />}
  </div>
}

export const EntryContent = () => {

  const {
    pasteEntryDetail,
    currentEntryDetails,
    currentEntry,
    removeEntry,
    editEntry,
    getEntryDetails,
    generateRandomPassword,
    toggleCurrentEntry,
    currentEntries
  } = usePasswordManagerContext();

  if (!currentEntry) {
    return <div />;
  }

  const style: React.CSSProperties = {
    paddingLeft: '20px'
  };

  const onEditEntry = async () => {

    const entryDetails = await getEntryDetails(currentEntry.path);

    const editModal = <EntryModal
      mode="edit"
      currentEntries={currentEntries}
      entry={currentEntry}
      entryDetails={entryDetails}
      onEditEntry={editEntry}
      onGenerateRandomPassword={generateRandomPassword}
    />;

    showModal(editModal, findSP());
  }

  const onRemoveEntry = async () => {
    const removeModal = <RemoveEntryModal
      entry={currentEntry}
      onRemoveEntry={() => removeEntry(currentEntry)}
    />;

    showModal(removeModal, findSP());
  }

  return <div style={style}>
    {
      <>
        <ButtonItem
          layout="below"
          icon={<FaUser></FaUser>}
          label="Username"
          onClick={() => pasteEntryDetail('username')}
          description={<DetailDescription>{currentEntryDetails?.username}</DetailDescription>}
        >
          Paste
        </ButtonItem>

        <ButtonItem
          layout="below"
          label="Password"
          icon={<FaKey></FaKey>}
          onClick={() => pasteEntryDetail('password')}
          description={<DetailDescription>{currentEntryDetails?.password}</DetailDescription>}
        >
          Paste
        </ButtonItem>

        <Field childrenLayout="below" childrenContainerWidth="max">
          <Focusable style={{ display: 'flex', gap: '10px' }}>
            {
              currentEntry.displayMode === 'copy' && (
                <DialogButton
                  style={{ minWidth: '0', paddingLeft: '0', paddingRight: '0' }}
                  onClick={() => toggleCurrentEntry(currentEntry, 'full')}
                ><FaEye></FaEye></DialogButton>
              )
            }
            {
              currentEntry.displayMode === 'full' && (
                <DialogButton
                  style={{ minWidth: '0', paddingLeft: '0', paddingRight: '0' }}
                  onClick={() => toggleCurrentEntry(currentEntry, 'copy')}
                ><FaEyeSlash></FaEyeSlash></DialogButton>
              )
            }
            <DialogButton
              style={{ minWidth: '0', paddingLeft: '0', paddingRight: '0' }}
              className="DialogButton Secondary"
              onClick={onEditEntry}
            ><FaEdit></FaEdit></DialogButton>
            <DialogButton
              style={{ minWidth: '0', paddingLeft: '0', paddingRight: '0' }}
              onClick={onRemoveEntry}
            ><FaTrash></FaTrash></DialogButton>
          </Focusable>
        </Field>
      </>
    }
  </div>;
}