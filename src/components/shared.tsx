import { Button } from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import { FaCheckCircle, FaBan } from "react-icons/fa";

export interface ButtonItemIconContentProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  justifyContent?:
  | "space-between"
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-around"
  | "space-evenly";
}

export const ButtonItemIconContent = (props: ButtonItemIconContentProps) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: props.justifyContent || "space-between",
    }}
  >
    <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{props.icon}</div>
    <div
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        marginLeft: "15px",
      }}
    >
      {props.children}
    </div>
  </div>
);

export interface ButtonContentOverflowProps {
  children: React.ReactNode;
}

export const ButtonContentOverflow = (props: ButtonContentOverflowProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const buttonElement = ref.current.querySelector("button");

    const parent = buttonElement?.parentElement;

    if (!parent) {
      return;
    }

    parent.style.overflow = "hidden";
  }, [ref, ref.current]);

  return <div ref={ref}>{props.children}</div>;
};

export interface ModalContentProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  children: (isLoading: boolean) => React.ReactNode;
  onConfirm: () => Promise<void>;
  canConfirm: boolean;
  closeModal?: () => void;
}

export const ModalContent = (props: ModalContentProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onConfirm = async () => {
    setIsLoading(true);
    await props.onConfirm();
    props.closeModal?.();
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "20px",
          columnGap: "10px",
        }}
      >
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{props.icon}</div>

        <div
          style={{
            fontWeight: "bold",
            fontSize: "20px",
            whiteSpace: "normal",
            wordBreak: "break-word"
          }}
        >
          {props.title}
        </div>
      </div>
      {props.children(isLoading)}
      <Button
        style={{ marginBottom: "20px", marginTop: "20px" }}
        className="DialogButton Secondary"
        disabled={!props.canConfirm || isLoading}
        onClick={onConfirm}
      >
        <ButtonItemIconContent justifyContent="center" icon={<FaCheckCircle />}>
          Confirm
        </ButtonItemIconContent>
      </Button>
      <Button
        disabled={isLoading}
        className="DialogButton Secondary"
        onClick={() => props.closeModal?.()}
      >
        <ButtonItemIconContent justifyContent="center" icon={<FaBan />}>
          Cancel
        </ButtonItemIconContent>
      </Button>
    </>
  );
};
