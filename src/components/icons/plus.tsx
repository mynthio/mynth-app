import IconBase from "./icon-base";
import { Icon } from "./icon.type";

const PlusIcon: Icon = (props) => (
  <IconBase {...props}>
    <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
  </IconBase>
);

export default PlusIcon;
