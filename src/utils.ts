import { SteamClient } from "@decky/ui/dist/globals/SteamClient";
import capsuleImage from "../assets/shortcut/capsule.png";
import capsuleWideImage from "../assets/shortcut/capsule-wide.png";

declare var SteamClient: SteamClient;

declare var appStore: {
    allApps: {
        appid: number;
        display_name: string;
    }[],
    GetAppOverviewByAppID: (appid: number) => {
        m_gameid: string;
    }
};

declare var appDetailsStore: {
    GetAppDetails: (appid: number) => {
        strLaunchOptions: string;
    }
};

const findAppByName = (name: string) => {
    return appStore.allApps.find((app) =>
        app.display_name.trim().toLowerCase() === name.toLowerCase());
}

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
        if(typeof reader.result !== 'string') {
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

    const existingApp = findAppByName(shortcutName);
    let appId = -1;
    let launchTimeout = 500;
    if (!existingApp) {
        appId = await SteamClient.Apps.AddShortcut(shortcutName, shortcutExe, "", shortcutLaunchOptions);
        await SteamClient.Apps.SetShortcutName(appId, shortcutName);
        await SteamClient.Apps.SetShortcutExe(appId, shortcutExe);
        await SteamClient.Apps.SetShortcutLaunchOptions(appId, shortcutLaunchOptions);

        const capsuleImageBase64 = await fetchImageToBase64(capsuleImage);
        await SteamClient.Apps.SetCustomArtworkForApp(appId, capsuleImageBase64, "png", 0);
        const capsuleWideImageBase64 = await fetchImageToBase64(capsuleWideImage);
        await SteamClient.Apps.SetCustomArtworkForApp(appId, capsuleWideImageBase64, "png", 3);
    } else {
        appId = existingApp.appid;
        if (appDetailsStore.GetAppDetails(appId)?.strLaunchOptions !== shortcutLaunchOptions) {
            await SteamClient.Apps.SetShortcutLaunchOptions(appId, shortcutLaunchOptions);
        }else{
            launchTimeout = 0;
        }
    }

    setTimeout(() => {
        SteamClient.Apps.RunGame(findGameIdFromAppId(appId), "", -1, 100);
    }, launchTimeout);
}