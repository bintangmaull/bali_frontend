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
      className={`w-full px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-4xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black appearance-none ${
        disabled ? 'bg-[#C6FF00] cursor-not-allowed' : 'bg-[#C6FF00]'
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