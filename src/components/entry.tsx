import { ButtonItem } from "@decky/ui";
import { FaCaretDown, FaCaretRight, FaUser, FaKey, FaEye, FaFolder } from "react-icons/fa";
import { usePasswordManagerContext } from "../context";
import { Entry } from "../interfaces";
import { ButtonContentOverflow, ButtonItemIconContent } from "./shared";

export interface EntryComponentProps {
  entry: Entry;
}

export const EntryComponent = (props: EntryComponentProps) => {

  const { toggleCurrentEntry, currentEntry, pasteEntryDetail, currentEntryDetails } = usePasswordManagerContext();

  const isCurrentEntry = currentEntry?.path === props.entry.path;

  const style: React.CSSProperties | undefined = isCurrentEntry ? {
    paddingLeft: '20px'
  } : undefined;

  const detailDescription = (detail?: string) => currentEntryDetails
    ? <div style={{
      fontSize: '15px',
      overflowWrap: 'break-word',
      paddingTop: '10px'
    }}>{detail}</div>
    : undefined;

  return <div>
    <ButtonContentOverflow>
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
        icon={props.entry.folderPath ? <FaFolder/> : undefined}
      >
        <ButtonItemIconContent
          icon={isCurrentEntry ? <FaCaretDown /> : <FaCaretRight />}
        >{props.entry.title}</ButtonItemIconContent>
      </ButtonItem>
    </ButtonContentOverflow>

    <div style={style}>

      {
        isCurrentEntry && <>
          <ButtonItem
            layout="below"
            icon={<FaUser></FaUser>}
            label="Username"
            onClick={() => pasteEntryDetail('username')}
            description={detailDescription(currentEntryDetails?.username)}
          >
            Paste
          </ButtonItem>

          <ButtonItem
            layout="below"
            label="Password"
            icon={<FaKey></FaKey>}
            onClick={() => pasteEntryDetail('password')}
            description={detailDescription(currentEntryDetails?.password)}
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
    </div>

  </div>
}