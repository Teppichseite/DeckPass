import { useEffect, useState } from "react";
import { getStateBe, setStateBe } from "./backend";

export const usePersistentState = <T>(key: string, initialValue: T): [T, (value: T) => Promise<void>] => {
  const [state, _setState] = useState<T>(initialValue);

  useEffect(() => {
    getStateBe(key)
      .then(result => {
        console.log("result", result)
        _setState(JSON.parse(result))
      }
      )
      .catch(e => console.error("errrororor", e))
  }, []);

  const setState = async (value: T) => {
    await setStateBe(key, JSON.stringify(value))
    _setState(value);
  };

  return [state, setState];
}