import React from "react";
import { ReactNode, MouseEventHandler } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, disabled = false, ...props }) => {
  return (
    <button
      className="group cursor-pointer rounded-lg border border-neutral-700 px-5 py-2 transition-colors hover:border-neutral-600 dark:bg-neutral-800/30 dark:text-white"
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
