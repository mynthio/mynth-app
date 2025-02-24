import logo from "../assets/logo.svg";
export default function EmptyPage() {
  return (
    <div class="w-full h-full flex items-center justify-center">
      <div class="flex flex-col items-center justify-center gap-[30px]">
        <img
          src={logo}
          alt="logo"
          width={50}
          height={50}
          class="pointer-events-none"
        />

        <p class="text-[#eaf3ec]/70 text-[24px] font-light">
          Good morning, what would you like to do?
        </p>

        <div class="mt-[10px] flex items-center justify-center">
          <button class="rounded-[2px] bg-gradient-to-tr font-light text-[15px] from-white/5 to-white/0 px-[25px] py-[12px] relative after:absolute after:bg-white/70 after:w-[2px] after:left-1 after:top-1 after:bottom-1 hover:after:top-2 hover:after:bottom-2 after:transition-all active:after:left-2">
            Start a new chat
          </button>
        </div>
      </div>
    </div>
  );
}
