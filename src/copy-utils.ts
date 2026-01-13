import { Router, sleep } from "@decky/ui";
import { SteamClient } from "@decky/ui/dist/globals/steam-client";

declare var SteamClient: SteamClient;

export const pasteViaKeyboardInput = async (text: string) => {
  Router.CloseSideMenus();

  await sleep(500);

  for (const char of text) {
    SteamClient.Input.ControllerKeyboardSendText(char);
    await sleep(5);
  }
};
