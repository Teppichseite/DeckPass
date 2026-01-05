from logging import Logger
from keypass_cli import KeypassCli
import os

from collections import Counter

class PasswordManager:

    logger: Logger

    keepass_cli: KeypassCli

    def __init__(self, logger: Logger):
        self.logger = logger
        self.keepass_cli = KeypassCli(self.logger)

    def _check_database_path(self, database_path: str | None):
        if database_path is None:
            return None

        path = os.path.abspath(database_path)

        if not os.path.exists(path):
            return None

        return database_path

    def _remove_last_newline(self, s: str) -> str:
        return s[:-1] if s.endswith("\n") else s

    def is_open(self):
        return self.keepass_cli.is_open
    
    def are_dependencies_setup(self):
        return self.keepass_cli.is_setup()

    async def open(self, database_path: str, password: str):
        await self.keepass_cli.open(database_path, password)

    async def get_entries(self):
        entries = await self.keepass_cli.run_command("ls -R -f", 0.3)

        entries = [self._remove_last_newline(e) for e in entries]
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

        username = self._remove_last_newline(entry_details[0])
        password = self._remove_last_newline(entry_details[1])

        return [username, password]

    def close(self):
        self.entries = []
        self.keepass_cli.close()