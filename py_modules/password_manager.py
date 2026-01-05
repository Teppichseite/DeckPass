from logging import Logger
from keypass_cli import KeypassCli
import os

from collections import Counter

class PasswordManager:

    logger: Logger

    keepass_cli: KeypassCli | None = None

    database_folder: str

    def __init__(self, logger: Logger, database_folder: str):
        self.logger = logger
        self.database_folder = database_folder

    def is_open(self):
        return not (self.keepass_cli is not None or self.keepass_cli.is_open)

    
    def check_setup_state(self):
        is_keepass_setup = KeypassCli(self.logger).is_setup()

        database_path = self.check_database_path()

        return is_keepass_setup, self.database_folder, database_path

    def check_database_path(self):
        if not os.path.isdir(self.database_folder):
            os.makedirs(self.database_folder)
            return None

        files = os.listdir(self.database_folder)
        files.sort()
        database_files = [f for f in files if f.endswith(".kdbx")]

        if len(database_files) <= 0:
           return None

        return os.path.join(self.database_folder, database_files[0])

    def remove_last_newline(self, s: str) -> str:
        return s[:-1] if s.endswith("\n") else s

    async def open(self, password: str):
        self.keepass_cli = KeypassCli(self.logger)

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