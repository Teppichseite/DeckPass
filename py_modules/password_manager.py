from logging import Logger
import secrets
from keypass_cli import KeypassCli
import os
import hmac

from collections import Counter
from utils import escape_cli_input

class PasswordManager:

    logger: Logger

    keepass_cli: KeypassCli

    security_token = ""

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

        self._generate_security_token()
        return self.security_token

    async def get_entries(self, security_token: str):
        
        self._validate_security_token(security_token)

        entries = await self.keepass_cli.run_command("ls -R -f", 0.3)

        entries = [self._remove_last_newline(e) for e in entries]
        entries = [e for e in entries if not e.endswith("/")]
        entries = [e for e in entries if not e.endswith("[empty]")]
        entryCounts = Counter(entries)
        entries = [entry for entry in entries if entryCounts[entry] == 1]
        entries.sort()

        return entries

    async def get_entry_details(self, security_token: str, entry_name: str):

        self._validate_security_token(security_token)

        escaped_entry_name = escape_cli_input(entry_name)
        entry_details = await self.keepass_cli.run_command(
            f"show {escaped_entry_name} -s -a UserName -a Password", 0.3
        )

        username = self._remove_last_newline(entry_details[0])
        password = self._remove_last_newline(entry_details[1])

        return [username, password]

    async def generate_random_password(self, security_token: str):
        self._validate_security_token(security_token)

        result = await self.keepass_cli.run_command(f"generate -L 32 -l -U -n -s", 0.3)

        return self._remove_last_newline(result[0])

    async def create_entry(self, security_token: str, entry_name: str, username: str, password: str):
        self._validate_security_token(security_token)

        await self.keepass_cli.create_entry(entry_name, username, password)

    async def edit_entry(self, security_token: str, entry_name: str, new_entry_name: str, username: str, password: str):
        self._validate_security_token(security_token)

        await self.keepass_cli.edit_entry(entry_name, new_entry_name, username, password)

    async def remove_entry(self, security_token: str, entry_name: str):
        self._validate_security_token(security_token)

        escaped_entry_name = escape_cli_input(entry_name)
        await self.keepass_cli.run_command(f"rm {escaped_entry_name}", 0.5)

    async def create_database(self, database_path: str, password: str):
        await self.keepass_cli.create_database(database_path, password)

    def close(self):
        self.entries = []
        self.security_token = ""
        self.keepass_cli.close()

    def _generate_security_token(self):
        self.security_token = secrets.token_urlsafe(32)

    def _validate_security_token(self, security_token: str):
        is_valid = hmac.compare_digest(self.security_token, security_token)
        if not is_valid:
            raise ValueError("Invalid security token!")