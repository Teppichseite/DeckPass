import { PanelSection, PanelSectionRow, ButtonItem, showModal, findSP } from "@decky/ui";
import { FaDatabase, FaDesktop, FaFolder, FaKey, FaLock, FaLockOpen, FaPlus } from "react-icons/fa";
import { usePasswordManagerContext } from "../context";
import { EntryComponent } from "./entry";
import { ButtonItemIconContent } from "./shared";
import { SetupGuide } from "./setup-guide";
import { FileSelectionType, openFilePicker } from "@decky/api";
import { EntryModal } from "./modals/entry-modal";
import { CreateDatabaseModal } from "./modals/create-database-modal";
import { OpenDatabaseModal } from "./modals/open-database-modal";

export const PasswordManagerClosed = () => {

  const { openPasswordManager, setupState, editPasswordManager, selectDatabase, createDatabase } = usePasswordManagerContext();

  const isSetup = setupState?.areDependenciesSetup && !!setupState?.databasePath;

  const onSelectDatabase = async () => {
    await openFilePicker(
      FileSelectionType.FILE,
      setupState?.userHomePath || '/home/deck', true, true, () => true, ['kdbx']).then(async res => {
        await selectDatabase(res.path);
      });
  }

  const openDatabaseModal = <OpenDatabaseModal
    onOpen={(password) => openPasswordManager(password)}
  />;

  const createDatabaseModal = <CreateDatabaseModal onCreateDatabase={createDatabase} />;

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
          onClick={() => showModal(openDatabaseModal, findSP())}
        >
          <ButtonItemIconContent icon={<FaLockOpen />}>Open Database</ButtonItemIconContent>
        </ButtonItem>

        <ButtonItem
          layout="below"
          disabled={!setupState?.areDependenciesSetup}
          onClick={() => onSelectDatabase()}
        >
          <ButtonItemIconContent icon={<FaFolder />}>Select Database</ButtonItemIconContent>
        </ButtonItem>

        <ButtonItem
          layout="below"
          disabled={!setupState?.areDependenciesSetup}
          onClick={() => showModal(createDatabaseModal, findSP())}
        >
          <ButtonItemIconContent
            icon={<FaDatabase />}>
            Create Database
          </ButtonItemIconContent>
        </ButtonItem>

        <ButtonItem
          layout="below"
          disabled={!setupState?.areDependenciesSetup}
          onClick={() => editPasswordManager()}
        >
          <ButtonItemIconContent icon={<FaDesktop />}>Open KeePassXC</ButtonItemIconContent>
        </ButtonItem>

        <SetupGuide />

      </PanelSectionRow>
    </PanelSection >
  );
};

export const PasswordManagerOpened = () => {

  const { currentEntries, closePasswordManager, createEntry, generateRandomPassword } = usePasswordManagerContext();

  if (!currentEntries) {
    return <div />;
  }

  const createEntryModal = <EntryModal
    currentEntries={currentEntries}
    mode="create"
    onCreateEntry={createEntry}
    onGenerateRandomPassword={generateRandomPassword}
  />;

  return (
    <PanelSection>
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() => closePasswordManager()}
        >
          <ButtonItemIconContent icon={<FaLock />}>Close Database</ButtonItemIconContent>
        </ButtonItem>
        <ButtonItem
          layout="below"
          onClick={() => showModal(createEntryModal, findSP())}
        >
          <ButtonItemIconContent icon={<FaPlus />}>Create Entry</ButtonItemIconContent>
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