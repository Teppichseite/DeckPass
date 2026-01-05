import { createContext, useEffect, useState } from "react";
import { closePasswordManagerBe, mapBeEntriesToEntries, getEntriesBe, getEntryDetailsBe, openPasswordManagerBe, mapBeEntryDetailsToCurrentEntryDetails, mapBeSetupStateToSetupState, checkSetupStateBe, installKeepassFlatpakBe, checkKeepassFlatpakInstallStateBe } from "./backend";
import React from "react";
import { CurrentEntry, CurrentEntryDetails, CurrentEntryDisplayMode, Entry, KeepassFlatpakInstallState, SetupState } from "./interfaces";

import { useBackendState } from "./hooks";
import { toaster } from "@decky/api";
import { runKeepassShortcut } from "./shortcut-utils";
import { pasteViaKeyboardInput } from "./copy-utils";

export type UiState = 'loading' | 'error' | 'done';

interface PasswordManagerContextValue {
    currentEntries: Entry[] | null;
    currentEntry: CurrentEntry | null;
    currentEntryDetails: CurrentEntryDetails | null;
    setupState: SetupState | null;
    keepassFlatpakInstallState: KeepassFlatpakInstallState;
    openPasswordManager: (password: string) => Promise<void>;
    editPasswordManager: () => Promise<void>;
    closePasswordManager: () => Promise<void>;
    pasteEntryDetail: (detail: keyof CurrentEntryDetails) => Promise<void>;
    toggleCurrentEntry: (newCurrentEntry: Entry | null, displayMode: CurrentEntryDisplayMode) => Promise<void>;
    installKeepassFlatpak: () => Promise<void>;
}

const PasswordManagerContext = createContext<PasswordManagerContextValue>({
    currentEntries: null,
    currentEntry: null,
    currentEntryDetails: null,
    setupState: null,
    keepassFlatpakInstallState: 'initial',
    openPasswordManager: async () => { },
    editPasswordManager: async () => { },
    closePasswordManager: async () => { },
    pasteEntryDetail: async () => { },
    toggleCurrentEntry: async () => { },
    installKeepassFlatpak: async () => { }
});

export interface PasswordMangerContextProviderProps {
    children: React.ReactNode;
};

export const PasswordMangerContextProvider = (props: PasswordMangerContextProviderProps) => {

    const [currentEntryDetails, setCurrentEntryDetails] = useState<CurrentEntryDetails | null>(null);

    const [currentEntry, setCurrentEntry] = useBackendState<CurrentEntry | null>('currentEntry', null);
    const [currentEntries, setCurrentEntries] = useBackendState<Entry[] | null>('currentEntries', null);

    const [setupState, setSetupState] = useBackendState<SetupState | null>('setupState', null);

    const [keepassFlatpakInstallState, setKeepassFlatpakInstallState] = useState<KeepassFlatpakInstallState>('initial');

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
        const detailsBe = await getEntryDetailsBe(entryPath);

        return mapBeEntryDetailsToCurrentEntryDetails(detailsBe);
    }

    const pasteEntryDetail = async (detail: keyof CurrentEntryDetails) => {
        if (!currentEntry) {
            return;
        }

        const details = await getEntryDetails(currentEntry.path);

        const detailToPaste = details[detail];

        pasteViaKeyboardInput(detailToPaste);
    }

    const editPasswordManager = async () => {
        await runKeepassShortcut(setupState?.databasePath);
    }

    const toggleCurrentEntry = async (newCurrentEntry: Entry | null, displayMode: CurrentEntryDisplayMode) => {
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
                displayMode
            });
            return;
        }
    }

    useEffect(() => {
        if (currentEntry?.displayMode !== 'full') {
            setCurrentEntryDetails(null);
            return;
        }

        handleErrors('Failed to get details', async () => {
            setCurrentEntryDetails(await getEntryDetails(currentEntry.path))
        });
    }, [currentEntry, currentEntry?.displayMode]);

    useEffect(() => {
        handleErrors('Could not evaluate setup state', async () => {
            setSetupState(mapBeSetupStateToSetupState(await checkSetupStateBe()))
        });
    }, [keepassFlatpakInstallState]);

    const installKeepassFlatpak = async () => {
        installKeepassFlatpakBe().then(() => { });
        setKeepassFlatpakInstallState('installing');
    };

    useEffect(() => {
        if(keepassFlatpakInstallState !== 'installing') {
            return;
        }

        const refreshMs = 5 * 1000;
        let interval = setInterval(async () => {
            const installState = await checkKeepassFlatpakInstallStateBe();
            setKeepassFlatpakInstallState(installState);
            if (['done', 'error'].includes(installState)) {
                clearInterval(interval);
            }
        }, refreshMs);

        return () => {
            clearInterval(interval);
        };
    }, [keepassFlatpakInstallState, setKeepassFlatpakInstallState]);

    useEffect(() => {
        checkKeepassFlatpakInstallStateBe().then((installState) => {
            setKeepassFlatpakInstallState(installState);
        });
    }, []);

    const value: PasswordManagerContextValue = {
        currentEntries,
        currentEntry,
        currentEntryDetails,
        setupState,
        keepassFlatpakInstallState,
        openPasswordManager,
        editPasswordManager,
        closePasswordManager,
        pasteEntryDetail,
        toggleCurrentEntry,
        installKeepassFlatpak,
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