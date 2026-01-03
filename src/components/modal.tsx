import { Button, ModalRoot, ModalRootProps, TextField } from "@decky/ui";
import { useEffect, useRef, useState } from "react";

export interface InputModalProps extends ModalRootProps {
    onConfirm: (input: string) => Promise<void>;
    title: React.ReactNode;
    isPassword?: boolean;
}

export const InputModal = (props: InputModalProps) => {

    const [value, setValue] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const setInputType = () => {
            if (!wrapperRef.current) {
                return;
            }

            const inputElement = wrapperRef.current.querySelector('input') as HTMLInputElement;

            if (!inputElement) {
                return;
            }

            const targetType = !props.isPassword ? 'text' : 'password';
            if (inputElement.type !== targetType) {
                inputElement.type = targetType;
            }
        };

        setInputType();

        if (!wrapperRef.current) {
            return;
        }

        const observer = new MutationObserver(() => {
            setInputType();
        });

        observer.observe(wrapperRef.current, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['type']
        });

        return () => observer.disconnect();
    }, [props.isPassword]);

    const onConfirm = async () => {
        setIsLoading(true);
        await props.onConfirm(value);
        props.closeModal?.();
    }

    return <ModalRoot onCancel={() => { props.closeModal?.() }}>
        <div style={{
            marginBottom: '20px',
            fontWeight: 'bold',
            fontSize: '20px'
        }}>{props.title}</div>
        <div ref={wrapperRef}>
            <TextField
                disabled={isLoading}
                value={value}
                bIsPassword={true}
                onChange={e => setValue(e.target.value)}>
            </TextField>
        </div>
        <Button
            disabled={isLoading}
            style={{ marginBottom: '20px', marginTop: '20px' }}
            className="DialogButton Secondary"
            onClick={onConfirm}>Confirm</Button>
        <Button
            disabled={isLoading}
            className="DialogButton Secondary"
            onClick={() => props.closeModal?.()}>Cancel</Button>
    </ModalRoot>
};