import { cn } from "@/lib/utils";

export type AbiBotState = "idle" | "active" | "listening" | "speaking" | "menu";

/**
 * ABI's face: a small robot head with a glass visor, glowing eyes and an antenna, inside a
 * scanning ring. Pure CSS (see .abi-bot in globals.css), so it is cheap and needs no JS.
 * Idle it floats, blinks and looks around; listening and speaking animate the eyes and mouth.
 */
export function AbiBot({ state = "idle", size = 56, className }: { state?: AbiBotState; size?: number; className?: string }) {
  return (
    <span className={cn("abi-bot", className)} data-state={state} style={{ fontSize: size }} aria-hidden>
      <span className="abi-bot__ring" />
      <span className="abi-bot__head">
        <span className="abi-bot__antenna" />
        <span className="abi-bot__visor">
          <span className="abi-bot__eyes">
            <span className="abi-bot__eye" />
            <span className="abi-bot__eye" />
          </span>
          <span className="abi-bot__x" />
        </span>
        <span className="abi-bot__mouth">
          <i />
          <i />
          <i />
        </span>
      </span>
    </span>
  );
}
