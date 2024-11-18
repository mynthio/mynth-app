import IconBase from "./icon-base";
import { Icon } from "./icon.type";

const HouseSimpleIcon: Icon = (props) => (
  <IconBase {...props}>
    <path
      d="M40,216H216V120a8,8,0,0,0-2.34-5.66l-80-80a8,8,0,0,0-11.32,0l-80,80A8,8,0,0,0,40,120Z"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="16"
    />
  </IconBase>
);

export default HouseSimpleIcon;
