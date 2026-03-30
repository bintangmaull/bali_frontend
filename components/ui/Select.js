import { useTheme } from '../../context/ThemeContext';
import { ChevronDown } from 'lucide-react';

export default function Select({
  id,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = '— Pilih —',
  className = ''
}) {
  const { darkMode } = useTheme();
  
  return (
    <div className={`relative group ${className}`}>
      <select
        id={id}
        className={`w-full h-full pl-3 pr-8 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer appearance-none outline-none border focus:ring-2 focus:ring-blue-500/40 ${
          disabled 
            ? darkMode ? 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed' : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            : darkMode 
              ? 'bg-[#0D0F12]/80 text-white border-white/10 hover:bg-[#15181C] hover:border-white/20' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-sm'
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option key="default" value="" className={darkMode ? 'bg-[#0D0F12] text-gray-400' : 'bg-white text-slate-400'}>
          {placeholder}
        </option>
        {options.map((opt, index) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const label = typeof opt === 'object' ? opt.label : opt;
          return (
            <option 
              key={`${id}-${index}-${val}`} 
              value={val}
              className={darkMode ? 'bg-[#0D0F12] text-white' : 'bg-white text-slate-700'}
            >
              {label}
            </option>
          );
        })}
      </select>
      
      {/* Custom Chevron */}
      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:scale-110 ${
        darkMode ? 'text-gray-500' : 'text-slate-400'
      }`}>
        <ChevronDown size={14} strokeWidth={3} />
      </div>
    </div>
  );
}