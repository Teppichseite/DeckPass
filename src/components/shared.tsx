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
    <div>{props.children}</div>
</div>;
