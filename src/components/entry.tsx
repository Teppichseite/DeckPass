import { ButtonItem } from "@decky/ui";
import { FaCaretDown, FaCaretRight, FaUser, FaKey, FaEye, FaFolder } from "react-icons/fa";
import { usePasswordManagerContext } from "../context";
import { Entry } from "../interfaces";
import { ButtonContentOverflow, ButtonItemIconContent } from "./shared";
import { useEffect, useRef } from "react";

interface DetailDescriptionProps {
  children?: string;
}

const DetailDescription = ({ children }: DetailDescriptionProps) =>
  children ? <div style={{
    fontSize: '15px',
    overflowWrap: 'break-word',
    paddingTop: '10px'
  }}>{children}</div>
    : undefined;

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
            ? <DetailDescription>Select an input field before clicking on the paste button for your credentials.</DetailDescription>
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

  const { pasteEntryDetail, currentEntryDetails, toggleCurrentEntry, currentEntry } = usePasswordManagerContext();

  if (!currentEntry) {
    return <div />;
  }

  const style: React.CSSProperties = {
    paddingLeft: '20px'
  };

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

        {
          currentEntry.displayMode === "copy"
            ? <ButtonItem
              layout="below"
              label="Clear text"
              icon={<FaEye></FaEye>}
              onClick={() => {
                toggleCurrentEntry(currentEntry, 'full');
              }}
            >
              Show
            </ButtonItem>
            : <ButtonItem
              label="Clear text"
              layout="below"
              icon={<FaEye></FaEye>}
              onClick={() => {
                toggleCurrentEntry(currentEntry, 'copy');
              }}
            >
              Hide
            </ButtonItem>
        }
      </>
    }
  </div>;
}