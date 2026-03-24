import Image from "next/image";

const AVATAR_SRC = "/mitchell-avatar.svg";

type Props = {
  className?: string;
  /** Pixel width/height (square). Default 48. */
  size?: number;
};

/**
 * Mitchell — in-app grant writer (intake + form Q&amp;A). Avatar: East London straight-talker, heart of gold.
 */
export function MitchellAvatar({ className = "", size = 48 }: Props) {
  const s = Math.min(96, Math.max(24, size));
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 overflow-hidden rounded-full ring-2 ring-zinc-600 ring-offset-2 ring-offset-zinc-950 ${className}`}
      style={{ width: s, height: s }}
    >
      <Image
        src={AVATAR_SRC}
        alt=""
        width={s}
        height={s}
        unoptimized
        className="h-full w-full object-cover object-top"
        priority={false}
      />
    </span>
  );
}
