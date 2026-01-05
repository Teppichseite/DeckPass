import asyncio
from logging import Logger
import subprocess

class KeypassCli:

    logger: Logger

    is_open: bool = False

    def __init__(self, logger: Logger):
        self.logger = logger

    def _get_english_utf8_locale(self):
        try:
            locales = subprocess.check_output(["locale", "-a"], text=True).splitlines()
        except Exception:
            return "C"

        for candidate in ("C.UTF-8", "en_US.UTF-8", "en_US.utf8"):
            if candidate in locales:
                return candidate
        return "C"

    def _get_keyypass_command(self, *args: str):

        command = [
            "flatpak",
            "run",
            "--command=keepassxc-cli",
            "org.keepassxc.KeePassXC",
            *args
        ]

        return command

    def _get_env_variables(self):
        en_locale = self._get_english_utf8_locale()
        return {
            "LANG": en_locale,
            "LC_ALL": en_locale,
            "LD_LIBRARY_PATH": ""
        }

    async def _send(self, value: str):
        self.process.stdin.write((value + "\n").encode())
        await self.process.stdin.drain()

    async def _read(self, timeout: float):
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

    
    async def _read_until_input_expected(self):
        await self.process.stdout.readuntil("> ".encode())


    def is_setup(self):
        command = self._get_keyypass_command("-h")

        check_result = subprocess.run(
            command, 
            env=self._get_env_variables(),
            capture_output=True,
            text=True
        )
        if check_result.returncode != 0:
            self.logger.error(f"Failed to check KeypassXC setup: {check_result.stderr}", exc_info=True)
            return False

        return True
        
    async def open(self, db_path: str, password: str):
        if self.is_open:
            self.close()

        command = self._get_keyypass_command("open", db_path)

        self.process = await asyncio.create_subprocess_exec(
            *command,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            close_fds=True,
            env=self._get_env_variables()
        )

        await self.process.stdout.readuntil("Enter password to unlock".encode())

        await self._send(password)

        await self._read_until_input_expected()

        self.is_open = True

    async def run_command(self, cmd: str, timeout: float):
        await self._send(cmd)
        result = await self._read(timeout)

        if len(result) < 1:
            raise ValueError("CLI results out of order!")

        await self._read_until_input_expected()
        return result[1:]

    def close(self):        
        self.process.kill()
        self.is_open = False
