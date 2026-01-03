import os
import subprocess

import decky
from settings import SettingsManager

import asyncio

from collections import Counter

class KeypassFlatpak:
    install_state: str = "initial"

    async def install(self):

        self.install_state = "installing"

        commandAddRemote = [
            "LD_LIBRARY_PATH= ",
            "flatpak",
            "remote-add",
            "--user",
            "--if-not-exists",
            "flathub",
            "https://dl.flathub.org/repo/flathub.flatpakrepo"
        ]

        commandInstallFlatpak = [
            "LD_LIBRARY_PATH= ",
            "flatpak",
            "install",
            "--user",  
            "flathub",
            "org.keepassxc.KeePassXC",
            "-y"
        ]

        full_command = [
            "bash", 
            "-c", 
            f"{' '.join(commandAddRemote)} && {' '.join(commandInstallFlatpak)}"
        ]

        decky.logger.info(f"Installing KeypassXC Flatpak: {' '.join(full_command)}")
        process = await asyncio.create_subprocess_exec(
            *full_command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        _, stderr = await process.communicate()

        if process.returncode != 0:
            self.install_state = "error"
            error_msg = stderr.decode() if stderr else "Unknown error"
            decky.logger.error(f"Failed to install KeypassXC Flatpak: {error_msg}", exc_info=True)
            raise ValueError("Failed to install KeypassXC Flatpak")

        decky.logger.info(f"KeypassXC Flatpak installed successfully")

        self.install_state = "done"

class KeypassCli:

    is_open: bool = False

    def find_english_utf8_locale(self):
        try:
            locales = subprocess.check_output(["locale", "-a"], text=True).splitlines()
        except Exception:
            return "C"

        for candidate in ("C.UTF-8", "en_US.UTF-8", "en_US.utf8"):
            if candidate in locales:
                return candidate
        return "C"

    def get_keyypass_command(self, *args: str):

        en_locale = self.find_english_utf8_locale()

        command = [
            f'LANG={en_locale}',
            f'LC_ALL={en_locale}',
            "LD_LIBRARY_PATH= ",
            "flatpak",
            "run",
            "--command=keepassxc-cli",
            "org.keepassxc.KeePassXC",
            *args
        ]

        full_command = ["bash", "-c", " ".join(command)]

        return full_command

    def is_setup(self):
        command = self.get_keyypass_command("-h")

        check_result = subprocess.run(command)

        return check_result.returncode == 0
        
    async def open(self, db_path: str, password: str):
        command = self.get_keyypass_command("open", db_path)

        self.process = await asyncio.create_subprocess_exec(
            *command,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        password_prompt = await self.process.stdout.read(2000)
        if not password_prompt.decode().startswith("Enter password to unlock"):
            raise ValueError("CLI results out of order!")

        await self.send(password)

        try:
            await self.read_until_input_expected()
        except:
            raise ValueError("Failed to open database with password")

        self.is_open = True



    def close(self):
        self.process.terminate()
        self.is_open = False

    async def read_until_input_expected(self):
        await self.process.stdout.readuntil("> ".encode())

    async def run_command(self, cmd: str, timeout: float):
        await self.send(cmd)
        result = await self.read(timeout)

        if len(result) < 1:
            raise ValueError("CLI results out of order!")

        await self.read_until_input_expected()
        return result[1:]

    async def send(self, value: str):
        self.process.stdin.write((value + "\n").encode())
        await self.process.stdin.drain()

    async def read(self, timeout: float):
        output: list[str] = []
        while True:
            try:
                line = await asyncio.wait_for(self.process.stdout.readline(), timeout)
                if not line:
                    break
                output.append(line.decode())
            except asyncio.TimeoutError:
                break
        return output

    def raise_out_of_order_error(self):
        raise ValueError("CLI results out of order!")

class PasswordManager:

    keepass_cli: KeypassCli | None = None

    def is_open(self):
        return not (self.keepass_cli is not None or self.keepass_cli.is_open)
    
    def get_database_folder(self):
        return os.path.join(decky.DECKY_USER_HOME, "DeckPass")
    
    def check_setup_state(self):
        is_keepass_setup = KeypassCli().is_setup()

        database_folder = self.get_database_folder()

        database_path = self.check_database_path()

        return is_keepass_setup, database_folder, database_path

    def check_database_path(self):
        folder_path = self.get_database_folder()
        if not os.path.isdir(folder_path):
            os.makedirs(folder_path)
            return None

        files = os.listdir(folder_path)
        files.sort()
        database_files = [f for f in files if f.endswith(".kdbx")]

        if len(database_files) <= 0:
           return None

        return os.path.join(folder_path, database_files[0])

    def remove_last_newline(self, s: str) -> str:
        return s[:-1] if s.endswith("\n") else s

    async def open(self, password: str):
        self.keepass_cli = KeypassCli()

        db_path = self.check_database_path()
        if db_path is None:
            raise ValueError("Could not find Database")
        
        await self.keepass_cli.open(db_path, password)

    def close(self):
        self.entries = []
        self.keepass_cli.close()
        self.keepass_cli = None

    async def get_entries(self):
        entries = await self.keepass_cli.run_command("ls -R -f", 0.3)

        entries = [self.remove_last_newline(e) for e in entries]
        entries = [e for e in entries if not e.endswith("/")]
        entries = [e for e in entries if not e.endswith("[empty]")]
        entryCounts = Counter(entries)
        entries = [entry for entry in entries if entryCounts[entry] == 1]
        entries.sort()

        return entries

    async def get_entry_details(self, entry_name: str):
        entry_details = await self.keepass_cli.run_command(
            f"show \"{entry_name}\" -s -a UserName -a Password", 0.3
        )

        username = self.remove_last_newline(entry_details[0])
        password = self.remove_last_newline(entry_details[1])

        return [username, password]

class Plugin:

    pm = PasswordManager()

    states: dict[str, str] = dict()

    keepass_flatpak: KeypassFlatpak = KeypassFlatpak()

    settings: SettingsManager

    async def check_setup_state(self):
        try:
            return self.pm.check_setup_state()
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
            await asyncio.wait_for(self.pm.open(password), 10)
        except:
            error_message = "Failed to open password manager!"
            decky.logger.error(error_message, exc_info=True)
            raise ValueError(error_message)

    async def close_password_manager(self):
        self.pm.close()
        self.states.clear()

    async def get_entries(self):
        try:
            return await asyncio.wait_for(self.pm.get_entries(), 5)
        except:
            error_message = "Failed to get entries!"
            decky.logger.error(error_message, exc_info=True)
            raise ValueError(error_message)

    async def get_entry_details(self, entry_name: str):
        try:
            return await asyncio.wait_for(self.pm.get_entry_details(entry_name), 5)
        except:
            error_message = "Failed to get entry details!"
            decky.logger.error(error_message, exc_info=True)
            raise ValueError(error_message)

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
        decky.logger.info("Loaded DeckPass plugin")

        self.settings = SettingsManager(name="settings", settings_directory=decky.DECKY_PLUGIN_SETTINGS_DIR)
        self.settings.read()

    async def _unload(self):
        decky.logger.info("Unloaded DeckPass plugin")

    async def _uninstall(self):
        decky.logger.info("Uninstalled DeckPass plugin")

    async def _migration(self):
        decky.logger.info("Migrated DeckPass plugin")
