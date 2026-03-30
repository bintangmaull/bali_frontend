// components/ui/Button.js
export default function Button({
  children,
  onClick,
  className = '',
  disabled = false,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'ghost'
  ...props
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20 shadow-lg';
      case 'danger':
        return 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20';
      case 'ghost':
        return 'bg-transparent text-gray-500 hover:text-white hover:bg-white/5';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 h-10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent flex items-center justify-center gap-2 ${getVariantClasses()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
  