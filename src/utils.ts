import { SteamClient } from "@decky/ui/dist/globals/SteamClient";
import capsuleImage from "../assets/shortcut/capsule.png";
import capsuleWideImage from "../assets/shortcut/capsule-wide.png";
import { getSettingBe, setSettingBe } from "./backend";

declare var SteamClient: SteamClient;

interface AppOverview {
    appid: number;
    m_gameid: string;
    display_name: string;
}

interface AppDetails {
    strLaunchOptions: string;
}

declare var appStore: {
    allApps: AppOverview[],
    GetAppOverviewByAppID: (appid: number) => AppOverview | null
};

declare var appDetailsStore: {
    GetAppDetails: (appid: number) => AppDetails | null
};

const findGameIdFromAppId = (appid: number) => {
    return appStore.GetAppOverviewByAppID(appid)?.m_gameid ?? "-1";
}

const fetchImageToBase64 = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        const onReject = () => reject(new Error('Failed to read image'));

        reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
                onReject();
                return;
            }
            const base64 = reader.result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = onReject;
        reader.readAsDataURL(blob);
    });
}

export const runKeepassShortcut = async (databasePath?: string | null) => {
    const shortcutName = "KeePassXC";
    const shortcutExe = "flatpak";
    const shortcutLaunchOptions = `run org.keepassxc.KeePassXC "${databasePath || ""}"`.trim();

    let appId = await getSettingBe("keepassShortcutAppId") || -1;

    const appOverview = appStore.GetAppOverviewByAppID(appId);

    let launchTimeout = 500;
    if (!appOverview) {
        appId = await SteamClient.Apps.AddShortcut(shortcutName, shortcutExe, "", shortcutLaunchOptions);
        await SteamClient.Apps.SetShortcutName(appId, shortcutName);
        await SteamClient.Apps.SetShortcutExe(appId, shortcutExe);
        await SteamClient.Apps.SetShortcutLaunchOptions(appId, shortcutLaunchOptions);

        await setSettingBe("keepassShortcutAppId", appId);

        const capsuleImageBase64 = await fetchImageToBase64(capsuleImage);
        await SteamClient.Apps.SetCustomArtworkForApp(appId, capsuleImageBase64, "png", 0);
        const capsuleWideImageBase64 = await fetchImageToBase64(capsuleWideImage);
        await SteamClient.Apps.SetCustomArtworkForApp(appId, capsuleWideImageBase64, "png", 3);
    } else {
        if (appDetailsStore.GetAppDetails(appId)?.strLaunchOptions !== shortcutLaunchOptions) {
            await SteamClient.Apps.SetShortcutLaunchOptions(appId, shortcutLaunchOptions);
        } else {
            launchTimeout = 0;
        }
    }

    setTimeout(() => {
        SteamClient.Apps.RunGame(findGameIdFromAppId(appId), "", -1, 100);
    }, launchTimeout);
}