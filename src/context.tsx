import { createContext, useEffect, useState } from "react";
import {
  closePasswordManagerBe,
  mapBeEntriesToEntries,
  getEntriesBe,
  getEntryDetailsBe,
  openPasswordManagerBe,
  mapBeEntryDetailsToCurrentEntryDetails,
  mapBeSetupStateToSetupState,
  checkSetupStateBe,
  installKeepassFlatpakBe,
  checkKeepassFlatpakInstallStateBe,
  setSettingBe,
  removeEntryBe,
  generateRandomPasswordBe,
  createEntryBe,
  createDatabaseBe,
  editEntryBe,
} from "./backend";
import React from "react";
import {
  CurrentEntry,
  CurrentEntryDetails,
  CurrentEntryDisplayMode,
  Entry,
  KeepassFlatpakInstallState,
  SetupState,
} from "./interfaces";

import { useJsContextState } from "./hooks";
import { toaster } from "@decky/api";
import { runKeepassShortcut } from "./shortcut-utils";
import { pasteViaKeyboardInput } from "./copy-utils";

let securityToken = "";

export type UiState = "loading" | "error" | "done";

interface PasswordManagerContextValue {
  currentEntries: Entry[] | null;
  currentEntry: CurrentEntry | null;
  currentEntryDetails: CurrentEntryDetails | null;
  setupState: SetupState | null;
  keepassFlatpakInstallState: KeepassFlatpakInstallState;
  selectDatabase: (databasePath: string) => Promise<void>;
  openPasswordManager: (password: string) => Promise<void>;
  editPasswordManager: () => Promise<void>;
  closePasswordManager: () => Promise<void>;
  pasteEntryDetail: (detail: keyof CurrentEntryDetails) => Promise<void>;
  toggleCurrentEntry: (
    newCurrentEntry: Entry | null,
    displayMode: CurrentEntryDisplayMode
  ) => Promise<void>;
  getEntryDetails: (entryPath: string) => Promise<CurrentEntryDetails>;
  installKeepassFlatpak: () => Promise<void>;

  createEntry: (title: string, username: string, password: string) => Promise<void>;
  editEntry: (
    title: string,
    newTitle: string,
    username: string,
    password: string
  ) => Promise<void>;
  generateRandomPassword: () => Promise<string>;
  removeEntry: (entry: Entry) => Promise<void>;

  createDatabase: (databasePath: string, password: string) => Promise<void>;
}

const PasswordManagerContext = createContext<PasswordManagerContextValue>({
  currentEntries: null,
  currentEntry: null,
  currentEntryDetails: null,
  setupState: null,
  keepassFlatpakInstallState: "initial",
  selectDatabase: async () => {},
  openPasswordManager: async () => {},
  editPasswordManager: async () => {},
  closePasswordManager: async () => {},
  pasteEntryDetail: async () => {},
  toggleCurrentEntry: async () => {},
  getEntryDetails: async () => ({ username: "", password: "" }),
  installKeepassFlatpak: async () => {},
  createEntry: async () => {},
  editEntry: async () => {},
  generateRandomPassword: async () => "abc",
  removeEntry: async () => {},
  createDatabase: async () => {},
});

export interface PasswordMangerContextProviderProps {
  children: React.ReactNode;
}

export const PasswordMangerContextProvider = (
  props: PasswordMangerContextProviderProps
) => {
  const [currentEntryDetails, setCurrentEntryDetails] =
    useState<CurrentEntryDetails | null>(null);

  const [currentEntry, setCurrentEntry] = useJsContextState<CurrentEntry | null>(
    "currentEntry",
    null
  );
  const [currentEntries, setCurrentEntries] = useJsContextState<Entry[] | null>(
    "currentEntries",
    null
  );

  const [setupState, setSetupState] = useState<SetupState | null>(null);

  const [keepassFlatpakInstallState, setKeepassFlatpakInstallState] =
    useState<KeepassFlatpakInstallState>("initial");

  const handleErrors = async (errorMessage: string, callback: () => Promise<void>) => {
    try {
      await callback();
    } catch (e) {
      console.error(e);
      toaster.toast({
        title: "DeckPass Error",
        body: errorMessage,
      });
      await setCurrentEntries(null);
      await setCurrentEntry(null);
    }
  };

  const reloadEntries = async () => {
    const beEntries = await getEntriesBe(securityToken);
    const entries = mapBeEntriesToEntries(beEntries);
    await setCurrentEntries(entries);
    return entries;
  };

  const openPasswordManager = async (password: string) =>
    handleErrors("Failed to open database", async () => {
      securityToken = await openPasswordManagerBe(password);
      await reloadEntries();
    });

  const closePasswordManager = async () => {
    await closePasswordManagerBe();
    await setCurrentEntries(null);
    await setCurrentEntry(null);
    securityToken = "";
  };

  const getEntryDetails = async (entryPath: string): Promise<CurrentEntryDetails> => {
    const detailsBe = await getEntryDetailsBe(securityToken, entryPath);

    return mapBeEntryDetailsToCurrentEntryDetails(detailsBe);
  };

  const pasteEntryDetail = async (detail: keyof CurrentEntryDetails) => {
    if (!currentEntry) {
      return;
    }

    const details = await getEntryDetails(currentEntry.path);

    const detailToPaste = details[detail];

    pasteViaKeyboardInput(detailToPaste);
  };

  const editPasswordManager = async () => {
    await runKeepassShortcut(setupState?.databasePath);
  };

  const toggleCurrentEntry = async (
    newCurrentEntry: Entry | null,
    displayMode: CurrentEntryDisplayMode
  ) => {
    if (!newCurrentEntry) {
      setCurrentEntry(null);
      return;
    }

    if (displayMode === "copy") {
      await setCurrentEntry({
        ...newCurrentEntry,
        displayMode,
      });
      return;
    }

    if (displayMode === "full") {
      await setCurrentEntry({
        ...newCurrentEntry,
        displayMode,
      });
      return;
    }
  };

  useEffect(() => {
    if (currentEntry?.displayMode !== "full") {
      setCurrentEntryDetails(null);
      return;
    }

    handleErrors("Failed to get details", async () => {
      setCurrentEntryDetails(await getEntryDetails(currentEntry.path));
    });
  }, [currentEntry, currentEntry?.displayMode]);

  const reloadSetupState = async () => {
    await handleErrors("Could not evaluate setup state", async () => {
      setSetupState(mapBeSetupStateToSetupState(await checkSetupStateBe()));
    });
  };

  useEffect(() => {
    reloadSetupState();
  }, [keepassFlatpakInstallState]);

  const installKeepassFlatpak = async () => {
    await handleErrors("Failed to install Keepass Flatpak", async () => {
      setKeepassFlatpakInstallState("installing");
      await installKeepassFlatpakBe();
    });
  };

  useEffect(() => {
    if (keepassFlatpakInstallState !== "installing") {
      return;
    }

    const refreshMs = 2 * 1000;
    let interval = setInterval(async () => {
      const installState = await checkKeepassFlatpakInstallStateBe();
      setKeepassFlatpakInstallState(installState);
      if (["initial", "done", "error"].includes(installState)) {
        clearInterval(interval);
      }
    }, refreshMs);

    return () => {
      clearInterval(interval);
    };
  }, [keepassFlatpakInstallState, setKeepassFlatpakInstallState]);

  useEffect(() => {
    handleErrors("Failed to check Keepass Flatpak install state", async () => {
      const installState = await checkKeepassFlatpakInstallStateBe();
      setKeepassFlatpakInstallState(installState);
    });
  }, []);

  const selectDatabase = async (databasePath: string) => {
    let resultingPath: string | null = databasePath;
    if (!databasePath.endsWith(".kdbx")) {
      resultingPath = null;
    }

    await setSettingBe("databasePath", resultingPath);
    await reloadSetupState();
  };

  const createEntry = async (title: string, username: string, password: string) => {
    await handleErrors("Failed to create entry", async () => {
      await createEntryBe(securityToken, title, username, password);
      const entries = await reloadEntries();
      const createdEntry = entries?.find((entry) => entry.path === title);
      if (!createdEntry) {
        return;
      }
      await toggleCurrentEntry(createdEntry, "copy");
    });
  };

  const editEntry = async (
    title: string,
    newTitle: string,
    username: string,
    password: string
  ) => {
    await handleErrors("Failed to edit entry", async () => {
      await editEntryBe(securityToken, title, newTitle, username, password);
      await reloadEntries();
    });
  };

  const generateRandomPassword = async () => {
    const result = await generateRandomPasswordBe(securityToken);
    return result;
  };

  const removeEntry = async (entry: Entry) => {
    await handleErrors("Failed to remove entry", async () => {
      await removeEntryBe(securityToken, entry.path);
      await reloadEntries();
      await toggleCurrentEntry(null, "copy");
    });
  };

  const createDatabase = async (databasePath: string, password: string) => {
    await handleErrors("Failed to create database", async () => {
      await createDatabaseBe(databasePath, password);
      await selectDatabase(databasePath);
    });
  };

  const value: PasswordManagerContextValue = {
    currentEntries,
    currentEntry,
    currentEntryDetails,
    setupState,
    keepassFlatpakInstallState,
    selectDatabase,
    openPasswordManager,
    editPasswordManager,
    closePasswordManager,
    pasteEntryDetail,
    toggleCurrentEntry,
    getEntryDetails,
    installKeepassFlatpak,
    createEntry,
    editEntry,
    generateRandomPassword,
    removeEntry,
    createDatabase,
  };

  return (
    <PasswordManagerContext.Provider value={value}>
      {props.children}
    </PasswordManagerContext.Provider>
  );
};

export const usePasswordManagerContext = () => {
  return React.useContext(PasswordManagerContext);
};
