import asyncio
from logging import Logger

INSTALL_SCRIPT = """
set -e
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak install --user flathub org.keepassxc.KeePassXC -y
"""

class KeypassFlatpak:

    logger: Logger

    install_state: str = "initial"

    def __init__(self, logger: Logger):
        self.logger = logger

    async def install(self):

        self.install_state = "installing"

        command = [
            "bash", 
            "-c", 
            INSTALL_SCRIPT
        ]

        self.logger.info(f"Installing KeypassXC Flatpak: {INSTALL_SCRIPT}")
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env={ "LD_LIBRARY_PATH": "" }
        )

        _, stderr = await process.communicate()

        if process.returncode != 0:
            self.install_state = "error"
            error_msg = stderr.decode() if stderr else "Unknown error"
            self.logger.error(f"Failed to install KeypassXC Flatpak: {error_msg}", exc_info=True)
            raise ValueError("Failed to install KeypassXC Flatpak")

        self.logger.info(f"KeypassXC Flatpak installed successfully")

        self.install_state = "done"
