import { createContext } from "react";
import { closePasswordManagerBe, mapBeEntriesToEntries, getEntriesBe, getEntryDetailsBe, openPasswordManagerBe } from "./backend";
import React from "react";
import { CurrentEntry, CurrentEntryDetails, CurrentEntryDisplayMode, Entry } from "./interfaces";
import { Router } from "@decky/ui";
import { SteamClient } from "@decky/ui/dist/globals/steam-client";
import { useBackendState } from "./hooks";
import { toaster } from "@decky/api";

declare var SteamClient: SteamClient;

export type UiState = 'loading' | 'error' | 'done';

interface PasswordManagerContextValue {
    currentEntries: Entry[] | null;
    currentEntry: CurrentEntry | null;
    openPasswordManager: (password: string) => Promise<void>;
    closePasswordManager: () => Promise<void>;
    pasteEntryDetail: (detail: keyof CurrentEntryDetails) => Promise<void>;
    toggleCurrentEntry: (newCurrentEntry: Entry | null, displayMode: CurrentEntryDisplayMode) => Promise<void>;
}

const PasswordManagerContext = createContext<PasswordManagerContextValue>({
    currentEntries: null,
    currentEntry: null,
    openPasswordManager: async () => { },
    closePasswordManager: async () => { },
    pasteEntryDetail: async () => { },
    toggleCurrentEntry: async () => { }
});

PasswordManagerContext

export interface PasswordMangerContextProviderProps {
    children: React.ReactNode;
};

export const PasswordMangerContextProvider = (props: PasswordMangerContextProviderProps) => {

    const [currentEntry, setCurrentEntry] = useBackendState<CurrentEntry | null>('currentEntry', null);
    const [currentEntries, setCurrentEntries] = useBackendState<Entry[] | null>('currentEntries', null);

    const handleErrors = async (errorMessage: string, callback: () => Promise<void>) => {
        try {
            await callback();
        } catch (e) {
            console.error(e)
            toaster.toast({
                title: 'DeckPass Error',
                body: errorMessage
            });
            await setCurrentEntries(null);
            await setCurrentEntry(null);
        }
    }

    const reloadEntries = async () => {
        let entries = await getEntriesBe();
        await setCurrentEntries(mapBeEntriesToEntries(entries));
    }

    const openPasswordManager = async (password: string) => handleErrors(
        'Failed to open database', async () => {
            await openPasswordManagerBe(password)
            await reloadEntries();
        });

    const closePasswordManager = async () => {
        await closePasswordManagerBe()
        await setCurrentEntries(null);
    };

    const getEntryDetails = async (entryPath: string): Promise<CurrentEntryDetails> => {
        const [username, password] = await getEntryDetailsBe(entryPath);

        return {
            username,
            password
        };
    }

    const pasteEntryDetail = async (detail: keyof CurrentEntryDetails) => {
        if (!currentEntry) {
            return;
        }

        const details = await getEntryDetails(currentEntry.path);

        const detailToPaste = details[detail];

        Router.CloseSideMenus();
        setTimeout(() => {
            SteamClient.Input.ControllerKeyboardSendText(detailToPaste);
        }, 500);
    }

    const toggleCurrentEntry = (newCurrentEntry: Entry | null, displayMode: CurrentEntryDisplayMode) =>
        handleErrors('Failed to get details', async () => {
            if (!newCurrentEntry) {
                setCurrentEntry(null);
                return;
            }

            if (displayMode === 'copy') {
                await setCurrentEntry({
                    ...newCurrentEntry,
                    displayMode
                });
                return;
            }

            if (displayMode === 'full') {
                await setCurrentEntry({
                    ...newCurrentEntry,
                    displayMode,
                    details: await getEntryDetails(newCurrentEntry.path)
                });
                return;
            }
        });

    const value: PasswordManagerContextValue = {
        currentEntries: currentEntries,
        currentEntry: currentEntry,
        openPasswordManager,
        closePasswordManager,
        pasteEntryDetail,
        toggleCurrentEntry
    };

    return <PasswordManagerContext.Provider value={value}>
        {props.children}
    </PasswordManagerContext.Provider>
};

export const usePasswordManagerContext = () => {
    return React.useContext(
        PasswordManagerContext
    );
};