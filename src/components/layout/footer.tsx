import Link from "next/link";
import {
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";
import { Logo, NextBrandLogo } from "@/components/layout/logo";

export function Footer() {
  return (
    <footer className="bg-[#07172b] text-slate-300 text-xs">
      <div className="container-page py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
          {/* Column 1: Logo & Social */}
          <div className="space-y-4 lg:col-span-1">
            <div className="space-y-3">
              <Logo onBrand compact={false} />
              <NextBrandLogo onBrand className="h-9 w-auto" />
            </div>

            <div className="flex items-center gap-3.5 pt-2 text-slate-400">
              <a href="#" className="hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="size-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="size-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="size-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="YouTube">
                <Youtube className="size-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider mb-4 text-xs border-b border-white/10 pb-2">
              QUICK LINKS
            </h3>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">Products</Link></li>
              <li><Link href="/#industries" className="hover:text-white transition-colors">Industries</Link></li>
              <li><Link href="/about#quality" className="hover:text-white transition-colors">Quality</Link></li>
              <li><Link href="/about#infrastructure" className="hover:text-white transition-colors">Infrastructure</Link></li>
              <li><Link href="/about#careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Column 3: Products */}
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider mb-4 text-xs border-b border-white/10 pb-2">
              PRODUCTS
            </h3>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/products?category=furniture" className="hover:text-white transition-colors">Furniture</Link></li>
              <li><Link href="/products?category=crates" className="hover:text-white transition-colors">Crates & Bins</Link></li>
              <li><Link href="/products?category=household" className="hover:text-white transition-colors">Household Products</Link></li>
              <li><Link href="/products?category=industrial" className="hover:text-white transition-colors">Industrial Components</Link></li>
              <li><Link href="/products?category=pallets" className="hover:text-white transition-colors">Pallets</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Custom Moulding</Link></li>
            </ul>
          </div>

          {/* Column 4: Industries */}
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider mb-4 text-xs border-b border-white/10 pb-2">
              INDUSTRIES
            </h3>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/#industries" className="hover:text-white transition-colors">Home & Furniture</Link></li>
              <li><Link href="/#industries" className="hover:text-white transition-colors">Logistics & Storage</Link></li>
              <li><Link href="/#industries" className="hover:text-white transition-colors">Automotive</Link></li>
              <li><Link href="/#industries" className="hover:text-white transition-colors">Retail & Distribution</Link></li>
              <li><Link href="/#industries" className="hover:text-white transition-colors">Agriculture</Link></li>
            </ul>
          </div>

          {/* Column 5: Contact Us */}
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider mb-4 text-xs border-b border-white/10 pb-2">
              CONTACT US
            </h3>
            <ul className="space-y-3 text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="size-5 shrink-0 text-[#c8102e] mt-0.5" />
                <span>Plot No. A/2, Industrial Area, Your City - 000000, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-5 shrink-0 text-[#c8102e]" />
                <a href="tel:+911234567890" className="hover:text-white transition-colors">+91 12345 67890</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-5 shrink-0 text-[#c8102e]" />
                <a href="mailto:info@nppl.com" className="hover:text-white transition-colors">info@nppl.com</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Globe className="size-5 shrink-0 text-[#c8102e]" />
                <a href="https://www.nppl.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">www.nppl.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2025 National Plastic Moulded Products Limited. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
