import { useEffect, useRef } from "react";

export interface ButtonItemIconContentProps {
    children: React.ReactNode;
    icon: React.ReactNode
}

export const ButtonItemIconContent = (props: ButtonItemIconContentProps) => <div style={
    {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    }}>
    {props.icon}
    <div style={{
        overflow: 'hidden',
        textOverflow:'ellipsis',
        marginLeft: '15px'
    }}
    >{props.children}</div>
</div>;

export interface ButtonContentOverflowProps{
    children: React.ReactNode;
}

export const ButtonContentOverflow = (props: ButtonContentOverflowProps) => {
    
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(!ref.current){
            return;
        }

        const buttonElement = ref.current.querySelector('button');

        const parent = buttonElement?.parentElement;

        if(!parent){
            return;
        }

        parent.style.overflow = 'hidden';
    }, [ref, ref.current]);

    return <div ref={ref}>
        {props.children}
    </div>;
}
