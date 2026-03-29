// components/Footer.js
import { Facebook, Instagram, Twitter, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0D0F12] text-gray-200">
      <div className="mx-auto max-w-5xl px-6 py-16 flex flex-col items-center space-y-8">
        {/* Logo sebagai teks */}
        <h2 className="text-2xl font-bold text-[#1E5C9A]">Bali Multi-Hazard Risk Dashboard</h2>
        
        {/* Dua baris deskripsi */}
        <p className="text-center text-gray-400 max-w-lg">
          Hubungi kami untuk informasi lebih lanjut mengenai tata kelola risiko dan analisis bencana di Provinsi Bali.
        </p>

        {/* Social icons */}
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition" aria-label="Facebook">
            <Facebook size={24} />
          </a>
          <a href="#" className="hover:text-white transition" aria-label="Instagram">
            <Instagram size={24} />
          </a>
          <a href="#" className="hover:text-white transition" aria-label="Twitter">
            <Twitter size={24} />
          </a>
          <a href="#" className="hover:text-white transition" aria-label="Website">
            <Globe size={24} />
          </a>
        </div>
      </div>
    </footer>
  );
}
