import os
import asyncio

from keypass_flatpak import KeypassFlatpak
from password_manager import PasswordManager

import decky
from settings import SettingsManager

class Plugin:

    pm = PasswordManager(decky.logger)

    states: dict[str, str] = dict()

    keepass_flatpak: KeypassFlatpak = KeypassFlatpak(decky.logger)

    settings: SettingsManager

    async def check_setup_state(self):
        try:
            return self.pm.check_setup_state(self.settings.getSetting("databasePath"))
        except:
            error_message = "Failed to check setup state!"
            decky.logger.error(error_message, exc_info=True)
            raise ValueError(error_message)

    async def check_keepass_flatpak_install_state(self):
        return self.keepass_flatpak.install_state

    async def install_keepass_flatpak(self):
        try:
            await self.keepass_flatpak.install();
        except:
            error_message = "Failed to install KeypassXC Flatpak!"
            decky.logger.error(error_message, exc_info=True)
            raise ValueError(error_message)

    async def open_password_manager(self, password: str):
        try:
            await asyncio.wait_for(self.pm.open(self.settings.getSetting("databasePath"), password), 10)
        except:
            await self.close_password_manager()
            error_message = "Failed to open password manager!"
            decky.logger.error(error_message, exc_info=True)
            raise ValueError(error_message)

    async def get_entries(self):
        try:
            return await asyncio.wait_for(self.pm.get_entries(), 5)
        except:
            await self.close_password_manager()
            error_message = "Failed to get entries!"
            decky.logger.error(error_message, exc_info=True)
            raise ValueError(error_message)

    async def get_entry_details(self, entry_name: str):
        try:
            return await asyncio.wait_for(self.pm.get_entry_details(entry_name), 5)
        except:
            await self.close_password_manager()
            error_message = "Failed to get entry details!"
            decky.logger.error(error_message, exc_info=True)
            raise ValueError(error_message)

    async def close_password_manager(self):
        self.pm.close()
        self.states.clear()

    async def set_state(self, key: str, value: str):
        self.states[key] = value

    async def get_state(self, key: str):
        return self.states.get(key, "null")

    async def get_setting(self, key: str):
        return self.settings.getSetting(key)

    async def set_setting(self, key: str, value: str):
        self.settings.setSetting(key, value)
        self.settings.commit()

    async def _main(self): 
        decky.logger.info("Loading DeckPass...")

        self.settings = SettingsManager(name="settings", settings_directory=decky.DECKY_PLUGIN_SETTINGS_DIR)
        self.settings.read()

        decky.logger.info("Done loading DeckPass")

    async def _unload(self):
        decky.logger.info("Unloaded DeckPass")
        await self.close_password_manager()

    async def _uninstall(self):
        decky.logger.info("Uninstalled DeckPass")

    async def _migration(self):
        decky.logger.info("Migrated DeckPass")
