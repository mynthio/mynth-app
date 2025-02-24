import { createSignal } from "solid-js";

type Modal = "settings";

const [openModal, setOpenModal] = createSignal<Modal | null>(null);

export { openModal, setOpenModal };
