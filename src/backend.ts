import { callable } from "@decky/api";
import { CurrentEntryDetails, Entry, SetupState } from "./interfaces";

export const openPasswordManagerBe = callable<[string], void>("open_password_manager");
export const closePasswordManagerBe = callable<[], void>("close_password_manager");
export const getEntriesBe = callable<[], string[]>("get_entries");
export const getEntryDetailsBe = callable<[string], [string, string]>("get_entry_details");
export const getStateBe = callable<[string], string>("get_state");
export const setStateBe = callable<[string, string], void>("set_state");
export const checkSetupStateBe = callable<[], [boolean, string, string]>("check_setup_state");

export const mapBeEntriesToEntries = (beEntries: string[]): Entry[] => {
    return beEntries
        .map(entry => {

            const entryParts = entry.split('/');

            const path = entry;

            const title = entryParts.slice(-1)[0];

            const folderPath = entryParts.length > 1
                ? `${entryParts.slice(0, -1).join('/')}/`
                : undefined;

            return {
                path,
                title,
                folderPath
            };
        })
        .sort((a, b) => a.path.localeCompare(b.path))
        .sort((a, b) => {
            const aHasFolder = !!a.folderPath;
            const bHasFolder = !!b.folderPath;

            if (aHasFolder && !bHasFolder) return 1;
            if (!aHasFolder && bHasFolder) return -1;

            return 0;
        });
};

export const mapBeEntryDetailsToCurrentEntryDetails = (beEntryDetails: [string, string]): CurrentEntryDetails => {
    const [username, password] = beEntryDetails;

    return {
        username,
        password
    };
};

export const mapBeSetupStateToSetupState = (beSetupState: [boolean, string, string]): SetupState => {
    const [
        areDependenciesSetup,
        databaseFolderPath,
        databasePath
    ] = beSetupState;

    return {
        areDependenciesSetup,
        databaseFolderPath,
        databasePath
    };
};
