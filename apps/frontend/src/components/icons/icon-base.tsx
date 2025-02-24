import { BaseIcon } from "./icon.type";

const IconBase: BaseIcon = ({ children, size = 24 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="currentColor"
      viewBox="0 0 256 256"
    >
      {children}
    </svg>
  );
};

export default IconBase;
