import { PanelSection, PanelSectionRow, ButtonItem, showModal, findSP, staticClasses } from "@decky/ui";
import { FaCaretDown, FaCaretRight, FaKey, FaLock, FaLockOpen } from "react-icons/fa";
import { usePasswordManagerContext } from "../context";
import { InputModal } from "./modal";
import { EntryComponent } from "./entry";
import { ButtonItemIconContent } from "./shared";
import { useState } from "react";

export const SetupGuide = () => {

  const { setupState } = usePasswordManagerContext();

  const [showGuide, setShowGuide] = useState(false)

  const isDoneText = (isDone: boolean) => isDone ? "✅ Done" : "❌ Not done";

  const listStyle = { paddingInlineStart: '25px' }

  return <div>
    <ButtonItem
      layout="below"
      onClick={() => {
        setShowGuide(!showGuide)
      }}
    >
      <ButtonItemIconContent icon={showGuide ? <FaCaretDown /> : <FaCaretRight />}>Setup Guide</ButtonItemIconContent>
    </ButtonItem>

    {
      showGuide && <div style={{ marginTop: '20px' }}>
        <strong>Follow those steps to setup DeckPass:</strong>
        <ol style={listStyle}>
          <li>
            Switch to Desktop Mode
          </li>
          <li>
            Install <strong>KeePassXC</strong> via the Discover App
            <ul style={listStyle}>
              <li>
                <strong>{isDoneText(!!setupState?.areDependenciesSetup)}</strong>
              </li>
            </ul>
          </li>
          <li>
            Open KeePassXC and create a new Database
          </li>
          <li>
            Add your entries. You can edit the Database later as often as you want
          </li>
          <li>
            Save the Database under the <strong>{setupState?.databaseFolderPath}</strong> folder
            <ul style={listStyle}>
              <li >
                <strong>{isDoneText(!!setupState?.databasePath)}</strong>
              </li>
            </ul>
          </li>
        </ol>
      </div>
    }
  </div>;
}

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

        <SetupGuide></SetupGuide>

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