import { ButtonItem, Focusable } from "@decky/ui";
import { useState } from "react";
import {
  FaCaretDown,
  FaCaretRight,
  FaCheckCircle,
  FaDownload,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import { usePasswordManagerContext } from "../context";
import { ButtonItemIconContent } from "./shared";
import { KeepassFlatpakInstallState } from "../interfaces";

const deckPassGithubUrl = "https://github.com/Teppichseite/DeckPass";

const isDoneIcon = (isDone: boolean) => (isDone ? "✅" : "❌");

const isDoneText = (isDone: boolean) =>
  isDone ? `${isDoneIcon(isDone)} Done` : `${isDoneIcon(isDone)} Not done`;

export const SetupGuide = () => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div>
      <ButtonItem
        layout="below"
        onClick={() => {
          setShowGuide(!showGuide);
        }}
      >
        <ButtonItemIconContent icon={showGuide ? <FaCaretDown /> : <FaCaretRight />}>
          Setup Guide
        </ButtonItemIconContent>
      </ButtonItem>

      {showGuide && (
        <div style={{ marginTop: "20px" }}>
          <KeypassInstallSteps />
          <div style={{ marginTop: "30px" }} />
          <DatabaseCreateSteps />
          <Focusable
            onActivate={() => {}}
            style={{ overflowWrap: "break-word", marginTop: "30px" }}
          >
            Please visit <strong>{deckPassGithubUrl}</strong> if you encounter any issues.
          </Focusable>
        </div>
      )}
    </div>
  );
};

const KeypassInstallSteps = () => {
  const { setupState, installKeepassFlatpak, keepassFlatpakInstallState } =
    usePasswordManagerContext();

  const installState = setupState?.areDependenciesSetup
    ? "done"
    : keepassFlatpakInstallState;

  const isInstallDisabled = ["done", "installing"].includes(installState);

  const buttonStates: Record<KeepassFlatpakInstallState, [React.ReactNode, string]> = {
    done: [<FaCheckCircle />, "Installed"],
    installing: [<FaSpinner />, "Installing..."],
    initial: [<FaDownload />, "Install"],
    error: [<FaExclamationTriangle />, "Try again"],
  };

  const [buttonIcon, buttonText] = buttonStates[installState];

  return (
    <div>
      <h4>
        <strong>
          1. Install KeePassXC: {isDoneText(!!setupState?.areDependenciesSetup)}
        </strong>
      </h4>
      <strong>Click</strong> the button below to install the{" "}
      <strong>KeePassXC Flatpak</strong>
      <ButtonItem
        layout="below"
        disabled={isInstallDisabled}
        onClick={() => {
          installKeepassFlatpak();
        }}
      >
        <ButtonItemIconContent icon={buttonIcon}>{buttonText}</ButtonItemIconContent>
      </ButtonItem>
      {installState === "error" && (
        <>
          <strong>Installation failed.</strong> Please try to install the{" "}
          <strong>KeypassXC Flatpak</strong> in <strong>Desktop Mode</strong>.
        </>
      )}
    </div>
  );
};

const DatabaseCreateSteps = () => {
  const { setupState } = usePasswordManagerContext();

  const listStyle = { paddingInlineStart: "25px" };

  return (
    <Focusable onActivate={() => {}}>
      <h4>
        <strong>2. Select a Database: {isDoneText(!!setupState?.databasePath)}</strong>
      </h4>
      <ol style={listStyle}>
        <li>
          You can either <strong>create a new database</strong> or select an{" "}
          <strong>existing KDBX database file</strong>
        </li>
        <li>
          You can create a new database by clicking on <strong>"Create Database"</strong>
        </li>
        <li>
          Or you can also create a new Database using the{" "}
          <strong>KeePassXC Desktop application</strong>
        </li>
      </ol>
    </Focusable>
  );
};
