import os
import asyncio
import traceback

from keypass_flatpak import KeypassFlatpak
from password_manager import PasswordManager

import decky
from settings import SettingsManager

class Plugin:

    pm = PasswordManager(decky.logger)

    keepass_flatpak: KeypassFlatpak = KeypassFlatpak(decky.logger)

    settings: SettingsManager

    def _get_database_path(self):
        path_str = self.settings.getSetting("databasePath")
        if path_str is None:
            return None

        path = os.path.abspath(path_str)
        if not os.path.exists(path):
            return None

        return path_str

    async def _handle_error(self, error_message: str, exception: Exception, close_password_manager: bool = False):
        if close_password_manager:
            await self.close_password_manager()
        decky.logger.error(error_message, exc_info=True)
        raise ValueError(error_message)

    async def check_setup_state(self):
        try:
            is_keepass_setup = self.pm.are_dependencies_setup()
            database_path = self._get_database_path()
            return is_keepass_setup, database_path, decky.DECKY_USER_HOME
        except Exception as e:
            await self._handle_error("Failed to check setup state!", e)

    async def check_keepass_flatpak_install_state(self):
        return self.keepass_flatpak.install_state

    async def install_keepass_flatpak(self):
        try:
            await self.keepass_flatpak.install();
        except Exception as e:
            await self._handle_error("Failed to install KeypassXC Flatpak!", e)

    async def open_password_manager(self, password: str):
        try:
            database_path = self._get_database_path()
            if database_path is None:
                raise ValueError("No database path set!")

            decky.logger.info(f"Opening database {database_path}")
            return await asyncio.wait_for(self.pm.open(database_path, password), 10)
        except Exception as e:
            await self._handle_error("Failed to open password manager!", e, True)

    async def get_entries(self, security_token: str):
        try:
            return await asyncio.wait_for(self.pm.get_entries(security_token), 5)
        except Exception as e:
            await self._handle_error("Failed to get entries!", e, True)

    async def get_entry_details(self, security_token: str, entry_name: str):
        try:
            return await asyncio.wait_for(self.pm.get_entry_details(security_token, entry_name), 5)
        except Exception as e:
            await self._handle_error("Failed to get entry details!", e, True)

    async def generate_random_password(self, security_token: str):
        try:
            return await asyncio.wait_for(self.pm.generate_random_password(security_token), 5)
        except Exception as e:
            await self._handle_error("Failed to generate random password!", e, True)

    async def create_entry(self, security_token: str, entry_name: str, username: str, password: str):
        try:
            await asyncio.wait_for(self.pm.create_entry(security_token, entry_name, username, password), 5)
        except Exception as e:
            await self._handle_error("Failed to create entry!", e, True)

    async def edit_entry(self, security_token: str, entry_name: str, new_entry_name: str, username: str, password: str):
        try:
            await asyncio.wait_for(self.pm.edit_entry(security_token, entry_name, new_entry_name, username, password), 5)
        except Exception as e:
            await self._handle_error("Failed to edit entry!", e, True)

    async def remove_entry(self, security_token: str, entry_name: str):
        try:
            await asyncio.wait_for(self.pm.remove_entry(security_token, entry_name), 5)
        except Exception as e:
            await self._handle_error("Failed to remove entry!", e, True)

    async def create_database(self, database_path: str, password: str):
        try:
            await asyncio.wait_for(self.pm.create_database(database_path, password), 5)
        except Exception as e:
            await self._handle_error("Failed to create database!", e)

    async def close_password_manager(self):
        decky.logger.info("Closing database")
        try:
            self.pm.close()
        except Exception as e:
            decky.logger.error("Failed to close password manager!", exc_info=True)
        
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

        
