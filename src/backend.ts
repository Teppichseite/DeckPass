import { callable } from "@decky/api";
import { Entry } from "./interfaces";

export const isPasswordManagerOpenBe = callable<[], boolean>("is_password_manager_open");
export const openPasswordManagerBe = callable<[string], void>("open_password_manager");
export const closePasswordManagerBe = callable<[], void>("close_password_manager");
export const getEntriesBe = callable<[], string[]>("get_entries");
export const getEntryDetailsBe = callable<[string], [string, string]>("get_entry_details");
export const getStateBe = callable<[string], string>("get_state");
export const setStateBe = callable<[string, string], void>("set_state");

export const convertEntriesToItems = (entries: string[]): Entry[] => {
    return entries.map(entry => ({
        title: entry,
        path: entry,
        type: 'entry'
    }));
};
