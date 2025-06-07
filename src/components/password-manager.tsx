import { PanelSection, PanelSectionRow, ButtonItem, showModal, findSP } from "@decky/ui";
import { FaKey, FaLock, FaLockOpen } from "react-icons/fa";
import { usePasswordManagerContext } from "../context";
import { InputModal } from "./modal";
import { EntryComponent } from "./entry";
import { ButtonItemIconContent } from "./shared";
import { SetupGuide } from "./setup-guide";

export const PasswordManagerClosed = () => {

  const { openPasswordManager, setupState } = usePasswordManagerContext();

  const isSetup = setupState?.areDependenciesSetup && !!setupState?.databasePath;

  const passwordModal = <InputModal
    onConfirm={(password) => openPasswordManager(password)}
    title={"Enter Database Password"}
    inputLabel={"Password"} />;

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

        {!isSetup && <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
          <strong>DeckPass is not fully setup yet.</strong> Please follow the Setup Guide to complete the required steps.
        </div>}

        <ButtonItem
          layout="below"
          disabled={!isSetup}
          onClick={() => showModal(passwordModal, findSP())}
        >
          <ButtonItemIconContent icon={<FaLockOpen />}>Open Database</ButtonItemIconContent>
        </ButtonItem>

        <SetupGuide />

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
        currentEntries.map(entry => <EntryComponent key={entry.path} entry={entry} />)
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