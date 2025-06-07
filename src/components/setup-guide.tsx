import { ButtonItem } from "@decky/ui";
import { useState } from "react";
import { FaCaretDown, FaCaretRight } from "react-icons/fa";
import { usePasswordManagerContext } from "../context";
import { ButtonItemIconContent } from "./shared";

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
                        Install the <strong>KeePassXC</strong> Flatpak via the Discover App
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
                <div
                    style={{ overflowWrap: 'break-word' }}
                >Please visit <strong>https://github.com/Teppichseite/DeckPass</strong> if you encounter any issues.</div>
            </div>
        }
    </div>;
};