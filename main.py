import os

import decky
import asyncio

import os

class KeyPassCli:

    isOpen: bool = False

    async def open(self, dbPath: str, password: str):
        command = [
            "LD_LIBRARY_PATH= ",
            "flatpak",
            "run",
            "--command=keepassxc-cli",
            "org.keepassxc.KeePassXC",
            "open",
            dbPath,
        ]

        full_command = ["bash", "-c", " ".join(command)]

        self.process = await asyncio.create_subprocess_exec(
            *full_command,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        await asyncio.sleep(0.3)
        await self.send(password)
        await asyncio.sleep(1)
        result = await self.read(0.3)

        if len(result) != 1:
            self.raiseOutOfOrderError()
            return

        if not result[0].startswith('Enter password to unlock '):
            self.raiseOutOfOrderError()
            return
        
        self.isOpen = True

    def close(self):
        self.process.terminate()
        self.isOpen = False

    async def runCommand(self, cmd: str, timeout: float):
        await self.send(cmd)
        result = await self.read(timeout)

        if len(result) < 2:
            self.raiseOutOfOrderError()
            return

        if not result[0].endswith(f'> {cmd}\n'):
            self.raiseOutOfOrderError()
            return
        
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
    
    def raiseOutOfOrderError(self):        
        raise ValueError("CLI results out of order!")


class PasswordManager:

    entries: list[str] = []
    keePassCli: KeyPassCli | None = None

    def isOpen(self):
        return not (self.keePassCli is not None or self.keePassCli.isOpen)
    
    def findDatabasePath(self):
        folderPath = os.path.join(decky.DECKY_USER_HOME, 'DeckPass')
        if not os.path.isdir(folderPath): 
            raise ValueError('No database file was found')
        
        files = os.listdir(folderPath)
        files.sort()
        databaseFiles = [f for f in files if f.endswith('.kdbx')]

        if len(databaseFiles) <= 0:
            raise ValueError('No database file was found')

        return os.path.join(folderPath, databaseFiles[0])

    async def open(self, password: str):

        self.keePassCli = KeyPassCli()

        dbPath = self.findDatabasePath()
        await self.keePassCli.open(dbPath, password)

        entries = await self.keePassCli.runCommand('ls -R -f', 0.3)

        decky.logger.info(entries)

        entries = [e.rstrip('\n') for e in entries]
    
        self.entries = [e for e in entries if not e.endswith("/")]

    def close(self):
        self.entries = []
        self.keePassCli.close()
        self.keePassCli = None

    def getEntries(self):
        return self.entries

    async def getEntryDetails(self, entryName: str):
        entryDetails = await self.keePassCli.runCommand(f'show -s {entryName}', 0.3)

        username = entryDetails[1].split(":")[1].strip()
        password = entryDetails[2].split(":")[1].strip()

        return [username, password]


class Plugin:

    pm = PasswordManager()

    states: dict[str, str] = dict()

    async def isPasswordManagerOpen(self):
        return self.pm.isOpen()

    async def openPasswordManager(self, password: str):
        await self.pm.open(password)

    async def closePasswordManager(self):
        self.pm.close()
        self.states.clear()

    async def getEntries(self):
        return self.pm.getEntries()

    async def getEntryDetails(self, entryName: str):
        return await self.pm.getEntryDetails(entryName)

    async def setState(self, key: str, value: str):
        self.states[key] = value

    async def getState(self, key: str):
        return self.states.get(key, "null")

    async def _main(self):
        pass
        
    async def _unload(self):
        pass

    async def _uninstall(self):
        pass

    async def _migration(self):
        pass
