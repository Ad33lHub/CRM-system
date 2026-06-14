export default function BreakpointIndicator() {
  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-2 left-2 z-[9999] flex h-6 items-center rounded-full bg-black/80 px-2.5 text-[10px] font-mono text-white select-none pointer-events-none">
      <span className="block sm:hidden">xs</span>
      <span className="hidden sm:block md:hidden">sm</span>
      <span className="hidden md:block lg:hidden">md</span>
      <span className="hidden lg:block xl:hidden">lg</span>
      <span className="hidden xl:block 2xl:hidden">xl</span>
      <span className="hidden 2xl:block">2xl</span>
    </div>
  );
}
