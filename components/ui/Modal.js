import { useTheme } from "../../context/ThemeContext";

export default function Modal({ isOpen, onClose, maxWidth = "max-w-md", children }) {
  const { darkMode } = useTheme();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-3xl p-6 w-full ${maxWidth} shadow-xl relative transition-colors duration-300`}>
        <div className="overflow-y-auto max-h-[80vh]">
          {children}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
