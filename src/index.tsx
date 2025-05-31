import {
  staticClasses,
} from "@decky/ui";
import {
  definePlugin,
} from "@decky/api"
import { FaKey } from "react-icons/fa";
import { PasswordMangerContextProvider } from "./context";
import { PasswordManager } from "./components/password-manager";

function Content() {
  return <PasswordMangerContextProvider>
    <PasswordManager></PasswordManager>
  </PasswordMangerContextProvider>
};

export default definePlugin(() => {
  return {
    name: "DeckPass",
    titleView: <div className={staticClasses.Title}>DeckPass</div>,
    content: <Content />,
    icon: <FaKey />,
    onDismount() { },
  };
});
