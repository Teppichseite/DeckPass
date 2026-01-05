import { PanelSection, PanelSectionRow, ButtonItem, showModal, findSP } from "@decky/ui";
import { FaDatabase, FaEdit, FaKey, FaLock, FaLockOpen, FaPlus } from "react-icons/fa";
import { usePasswordManagerContext } from "../context";
import { InputModal } from "./modal";
import { EntryComponent } from "./entry";
import { ButtonItemIconContent } from "./shared";
import { SetupGuide } from "./setup-guide";
import { FileSelectionType, openFilePicker } from "@decky/api";

export const PasswordManagerClosed = () => {

  const { openPasswordManager, setupState, editPasswordManager, selectDatabase } = usePasswordManagerContext();

  const isSetup = setupState?.areDependenciesSetup && !!setupState?.databasePath;

  const onSelectDatabase = async () => {
    await openFilePicker(FileSelectionType.FILE, '/home/deck', true, true, () => true, ['kdbx']).then(async res => {
      await selectDatabase(res.path);
    });
  }

  const passwordModal = <InputModal
    onConfirm={(password) => openPasswordManager(password)}
    title="Enter Database Password"
    isPassword={true}
    />;

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

        {!setupState?.areDependenciesSetup && <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
          <strong>DeckPass is not fully setup yet.</strong> Please follow the Setup Guide to complete the required steps.
        </div>}

        {!!setupState?.areDependenciesSetup && !setupState?.databasePath && <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
          <strong>No database</strong> is selected yet.
        </div>}

        {isSetup && <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
          <div>Selected Database</div>
          <div><strong>{setupState?.databasePath?.split('/')?.pop()}</strong></div>
        </div>}

        <ButtonItem
          layout="below"
          disabled={!isSetup}
          onClick={() => showModal(passwordModal, findSP())}
        >
          <ButtonItemIconContent icon={<FaLockOpen />}>Open Database</ButtonItemIconContent>
        </ButtonItem>

        <ButtonItem
          layout="below"
          disabled={!setupState?.areDependenciesSetup}
          onClick={onSelectDatabase}
        >
          <ButtonItemIconContent icon={<FaDatabase />}>Select Database</ButtonItemIconContent>
        </ButtonItem>

        <ButtonItem
          layout="below"
          disabled={!setupState?.areDependenciesSetup}
          onClick={() => editPasswordManager()}
        >
          <ButtonItemIconContent
            icon={!!setupState?.databasePath ? <FaEdit /> : <FaPlus />}>
            {!!setupState?.databasePath ? 'Edit Database' : 'Create Database'}
          </ButtonItemIconContent>
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