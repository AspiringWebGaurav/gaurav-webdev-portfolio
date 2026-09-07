import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  as: Component = "h1",
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  as?: "h1" | "h2" | "h3" | "div";
}) => {
  const wordsArray = words.split(" ");

  return (
    <Component className={cn("font-bold", className)}>
      <span className="my-4 block">
        <span className="dark:text-white text-black leading-snug tracking-wide">
          {wordsArray.map((word, idx) => (
            <span
              key={`${word}-${idx}`}
              className={cn(
                "inline-block mr-1.5 sm:mr-2 md:mr-3",
                idx > 3 ? "text-purple" : "dark:text-white text-black"
              )}
              style={{
                animation: "textGlideIn 0.8s ease-out both",
                animationDelay: `${idx * 0.12}s`,
                willChange: "opacity, transform, filter",
              }}
            >
              {word}
            </span>
          ))}
        </span>
      </span>
    </Component>
  );
};

export default TextGenerateEffect;
