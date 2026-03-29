// components/ui/Select.js
export default function Select({
  id,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = '— Pilih —',
  className = ''
}) {
  return (
  <div className="relative">  
    <select
      id={id}
      className={`w-full px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-[11px] font-medium rounded-3xl focus:ring-2 focus:ring-[#1E5C9A] focus:border-[#1E5C9A] transition-colors text-white appearance-none ${
        disabled ? 'bg-[#1E5C9A] cursor-not-allowed' : 'bg-[#1E5C9A]'
      } ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option key="default" value="">{placeholder}</option>
      {options.map((opt, index) => {
        // Handle both string and object options
        const value = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : opt;
        return (
          <option key={`${id}-${index}-${value}`} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  </div>
  );
}