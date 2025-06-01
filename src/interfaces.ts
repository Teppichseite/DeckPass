export type Entry = {
    path: string;
    title: string;
    folderPath?: string;
};

export type CurrentEntryDisplayMode = 'copy' | 'full';

export type CurrentEntryDetails = {
    username: string;
    password: string;
};

export type CurrentEntry = Entry & {
    displayMode: CurrentEntryDisplayMode;
};

