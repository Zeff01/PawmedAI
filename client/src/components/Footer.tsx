import { Link } from '@tanstack/react-router'
import { PawIcon } from './custom/custom-icons'
import { Facebook, Github, Instagram, Linkedin, Envelope, Phone, GeoAlt } from 'react-bootstrap-icons'
import '../styles.css'

const navLinks = [
  { to: '/classify', label: 'Classify Disease' },
  { to: '/classify-breed', label: 'Classify Breed' },
  { to: '/nearby-vets', label: 'Nearby Vets' },
]

const contactInfo = {
    email: "pawmed.ai27@gmail.com",
    phone: "0977 344 0291",
    address: "Cebu City, Philippines"
}

const socialMediaLinks = [
    { platform: "Facebook", url: "https://www.facebook.com/Codebilitydev", icon: Facebook },
    { platform: "Instagram", url: "https://www.instagram.com/codebilitydev/", icon: Instagram },
    { platform: "LinkedIn", url: "https://www.linkedin.com/company/codebilitytech/posts/", icon: Linkedin },
    { platform: "Github", url: "https://github.com/jpdevdotcom", icon: Github }
]

export function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-slate-50/50">
            <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
                    {/* Brand Section */}
                    <div className="flex flex-col gap-6">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg transition-transform group-hover:scale-105">
                                <div className="rotate-12 group-hover:rotate-0 transition-transform duration-300">
                                    <PawIcon />
                                </div>
                            </div>
                            <div className="leading-tight">
                                <p className="text-[14px] font-bold tracking-tight text-slate-900">
                                    Pawmed AI
                                </p>
                                <p className="text-[10.5px] font-medium tracking-wide text-slate-400">
                                    Veterinary Diagnostics
                                </p>
                            </div>
                        </Link>
                        <div className="flex items-center gap-4">
                            {socialMediaLinks.map((social) => {
                                const IconComponent = social.icon
                                return (
                                    <a 
                                        key={social.platform}
                                        href={social.url} 
                                        aria-label={social.platform} 
                                        className="rounded-full bg-white p-2 text-slate-400 shadow-sm ring-1 ring-slate-200 hover:text-blue-600 hover:ring-blue-600 transition-all"
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                    >
                                        <IconComponent size={18} />
                                    </a>
                                )
                            })}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-col gap-6">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                            Services
                        </h3>
                        <ul className="space-y-4">
                            {navLinks.map((link) => (
                                <li key={link.to}>
                                    <Link 
                                        to={link.to}
                                        className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium flex items-center gap-2 group"
                                    >
                                        <span className="h-px w-0 bg-blue-600 transition-all group-hover:w-4"></span>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="lg:col-span-2">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">
                            Contact Us
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3 group">
                                <Envelope className="mt-1 text-blue-600 flex-shrink-0" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                                    <p className="text-sm text-slate-600 font-medium transition-colors">{contactInfo.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <GeoAlt className="mt-1 text-blue-600 flex-shrink-0" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Location</p>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{contactInfo.address}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 group">
                                <Phone className="mt-1 text-blue-600 flex-shrink-0" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Phone</p>
                                    <p className="text-sm text-slate-600 font-medium transition-colors">{contactInfo.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}