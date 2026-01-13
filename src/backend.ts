import { callable } from "@decky/api";
import { CurrentEntryDetails, Entry, KeepassFlatpakInstallState, SettingsKey, SetupState } from "./interfaces";

export const openPasswordManagerBe = callable<[string], string>("open_password_manager");
export const closePasswordManagerBe = callable<[], void>("close_password_manager");

export const getEntriesBe = callable<[string], string[]>("get_entries");
export const getEntryDetailsBe = callable<[string, string], [string, string]>("get_entry_details");

export const generateRandomPasswordBe = callable<[string], string>("generate_random_password");
export const createEntryBe = callable<[string, string, string, string], void>("create_entry");
export const editEntryBe = callable<[string, string, string, string, string], void>("edit_entry");
export const removeEntryBe = callable<[string, string], void>("remove_entry");

export const createDatabaseBe = callable<[string, string], void>("create_database");

export const checkSetupStateBe = callable<[], [boolean, string | null, string]>("check_setup_state");

export const checkKeepassFlatpakInstallStateBe = callable<[], KeepassFlatpakInstallState>("check_keepass_flatpak_install_state");
export const installKeepassFlatpakBe = callable<[], void>("install_keepass_flatpak");

export const getSettingBe = callable<[SettingsKey], any>("get_setting");
export const setSettingBe = callable<[SettingsKey, any], void>("set_setting");

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

export const mapBeSetupStateToSetupState = (beSetupState: [boolean, string | null, string]): SetupState => {
    const [
        areDependenciesSetup,
        databasePath,
        userHomePath
    ] = beSetupState;

    return {
        areDependenciesSetup,
        databasePath,
        userHomePath
    };
};
