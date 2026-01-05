import asyncio
from logging import Logger
import subprocess

class KeypassCli:

    logger: Logger

    is_open: bool = False

    def __init__(self, logger: Logger):
        self.logger = logger

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

        command = [
            "flatpak",
            "run",
            "--command=keepassxc-cli",
            "org.keepassxc.KeePassXC",
            *args
        ]

        return command

    def get_env_variables(self):
        en_locale = self.find_english_utf8_locale()
        return {
            "LANG": en_locale,
            "LC_ALL": en_locale,
            "LD_LIBRARY_PATH": ""
        }

    def is_setup(self):
        command = self.get_keyypass_command("-h")

        check_result = subprocess.run(
            command, 
            env=self.get_env_variables()
        )

        return check_result.returncode == 0
        
    async def open(self, db_path: str, password: str):
        command = self.get_keyypass_command("open", db_path)

        self.process = await asyncio.create_subprocess_exec(
            *command,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=self.get_env_variables()
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