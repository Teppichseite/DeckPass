import { PanelSection, PanelSectionRow, ButtonItem, showModal, findSP } from "@decky/ui";
import { FaExclamationCircle, FaKey, FaLock, FaLockOpen } from "react-icons/fa";
import { usePasswordManagerContext } from "../context";
import { InputModal } from "./modal";
import { EntryComponent } from "./entry";
import { ButtonItemIconContent } from "./shared";

export const PasswordManagerClosed = () => {

  const { openPasswordManager } = usePasswordManagerContext();

  const passwordModal = <InputModal
    onConfirm={(password) => openPasswordManager(password)}
    title={"Enter Database Password"}
    inputLabel={"Password"} />;

  var gitHubLink = "https://github.com/Teppichseite/HandheldExp";

  return (
    <PanelSection>
      <PanelSectionRow>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '20px',
          marginBottom: '20px'
        }}>
          <FaKey size={60}></FaKey>
        </div>

        <ButtonItem
          layout="below"
          onClick={() => showModal(passwordModal, findSP())}
        >
          <ButtonItemIconContent icon={<FaLockOpen />}>Open Database</ButtonItemIconContent>
        </ButtonItem>

        <div style={{ marginTop: "20px", overflowWrap: 'break-word' }}>
          <FaExclamationCircle />{" "}Please visit <strong>{gitHubLink}</strong> to setup DeckPass for the first time
        </div>

      </PanelSectionRow>
    </PanelSection >
  );
};

export const PasswordManagerOpened = () => {

  const { currentEntries, closePasswordManager } = usePasswordManagerContext();

  if (!currentEntries) {
    return <div />;
  }

  return (
    <PanelSection>
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() => closePasswordManager()}
        >
          <ButtonItemIconContent icon={<FaLock />}>Close Database</ButtonItemIconContent>
        </ButtonItem>
        <div style={{ marginTop: '20px' }}></div>
      </PanelSectionRow>
      {
        currentEntries.map(entry =>
          <EntryComponent key={entry.path} entry={entry} />)
      }
    </PanelSection>
  );
}

export const PasswordManager = () => {
  const { currentEntries } = usePasswordManagerContext();

  return currentEntries 
    ? <PasswordManagerOpened /> 
    : <PasswordManagerClosed />;
};