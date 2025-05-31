import { Button, ModalRoot, ModalRootProps, TextField } from "@decky/ui";
import { useEffect, useRef, useState } from "react";

export interface InputModalProps extends ModalRootProps {
    onConfirm: (input: string) => Promise<void>;
    title: React.ReactNode;
    inputLabel: React.ReactNode;
}

export const InputModal = (props: InputModalProps) => {

    const [value, setValue] = useState<string>('');

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) {
            return;
        }

        const inputElement = ref.current.querySelector('input');
        if (!inputElement) {
            return;
        }

        inputElement.type = 'password';
    }, [ref, ref.current]);

    return <ModalRoot onCancel={() => { props.closeModal?.() }}>
        <div style={{ marginBottom: '20px', fontWeight: 'bold', fontSize: '20px' }}>{props.title}</div>
        <div ref={ref}>
            <TextField value={value} onChange={e => setValue(e.target.value)}></TextField>
        </div>
        <Button style={{ marginBottom: '20px', marginTop: '20px' }} className="DialogButton Secondary" onClick={async () => {
            await props.onConfirm(value);
            props.closeModal?.();
        }}>Confirm</Button>
        <Button className="DialogButton Secondary" onClick={() => props.closeModal?.()}>Cancel</Button>
    </ModalRoot>
};