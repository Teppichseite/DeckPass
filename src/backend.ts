import { callable } from "@decky/api";
import { Entry } from "./interfaces";

export const isPasswordManagerOpenBe = callable<[], boolean>("isPasswordManagerOpen");
export const openPasswordManagerBe = callable<[string], void>("openPasswordManager");
export const closePasswordManagerBe = callable<[], void>("closePasswordManager");
export const getEntriesBe = callable<[], string[]>("getEntries");
export const getEntryDetailsBe = callable<[string], [string, string]>("getEntryDetails");
export const getStateBe = callable<[string], string>("getState");
export const setStateBe = callable<[string, string], void>("setState");

export const convertEntriesToItems = (entries: string[]): Entry[] => {
    return entries.map(entry => ({
        title: entry,
        path: entry,
        type: 'entry'
    }));
};
