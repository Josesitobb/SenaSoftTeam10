
export default function SallyButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
}) {
  const baseStyle =
    "px-5 py-2 rounded-full font-semibold transition-colors duration-300 focus:outline-none";

  const variants = {
    primary:
      "bg-[#D6AC92] text-[#3B2A26] hover:bg-[#c89b82] active:bg-[#b98c74]",
    secondary:
      "bg-transparent border border-[#D6AC92] text-[#3B2A26] hover:bg-[#D6AC92]/20",
    danger:
      "bg-[#E65C4F] text-white hover:bg-[#d84b3f] active:bg-[#c43e33]",
  };

  const disabledStyle = "opacity-50 cursor-not-allowed";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${
        disabled ? disabledStyle : ""
      }`}
    >
      {children}
    </button>
  );
}
