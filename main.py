import os

import decky
import asyncio

from collections import Counter


class KeypassCli:

    is_open: bool = False

    async def open(self, db_path: str, password: str):
        command = [
            "LD_LIBRARY_PATH= ",
            "flatpak",
            "run",
            "--command=keepassxc-cli",
            "org.keepassxc.KeePassXC",
            "open",
            db_path,
        ]

        full_command = ["bash", "-c", " ".join(command)]

        self.process = await asyncio.create_subprocess_exec(
            *full_command,
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

    def find_database_path(self):
        folder_path = os.path.join(decky.DECKY_USER_HOME, "DeckPass")
        if not os.path.isdir(folder_path):
            raise ValueError("No database file was found")

        files = os.listdir(folder_path)
        files.sort()
        database_files = [f for f in files if f.endswith(".kdbx")]

        if len(database_files) <= 0:
            raise ValueError("No database file was found")

        return os.path.join(folder_path, database_files[0])

    def remove_last_newline(self, s: str) -> str:
        return s[:-1] if s.endswith("\n") else s

    async def open(self, password: str):
        self.keepass_cli = KeypassCli()

        db_path = self.find_database_path()
        await self.keepass_cli.open(db_path, password)

    def close(self):
        self.entries = []
        self.keepass_cli.close()
        self.keepass_cli = None

    async def get_entries(self):
        entries = await self.keepass_cli.run_command("ls -R -f", 0.3)

        entries = [self.remove_last_newline(e) for e in entries]
        entries = [e for e in entries if not e.endswith("/")]
        entryCounts = Counter(entries)
        entries = [entry for entry in entries if entryCounts[entry] == 1]
        entries.sort()

        return entries

    async def get_entry_details(self, entry_name: str):
        entry_details = await self.keepass_cli.run_command(
            f"show {entry_name} -s -a UserName -a Password", 0.3
        )

        username = self.remove_last_newline(entry_details[0])
        password = self.remove_last_newline(entry_details[1])

        return [username, password]

class Plugin:

    pm = PasswordManager()

    states: dict[str, str] = dict()

    async def open_password_manager(self, password: str):
        try:
            await asyncio.wait_for(self.pm.open(password), 10)
        except:
            raise ValueError("Failed to open database!")

    async def close_password_manager(self):
        self.pm.close()
        self.states.clear()

    async def get_entries(self):
        try:
            return await self.pm.get_entries()
        except:
            raise ValueError("Failed to get entries!")

    async def get_entry_details(self, entry_name: str):
        try:
            return await asyncio.wait_for(self.pm.get_entry_details(entry_name), 5)
        except:
            raise ValueError("Failed to get entry details!")

    async def set_state(self, key: str, value: str):
        self.states[key] = value

    async def get_state(self, key: str):
        return self.states.get(key, "null")

    async def _main(self):
        pass

    async def _unload(self):
        pass

    async def _uninstall(self):
        pass

    async def _migration(self):
        pass
