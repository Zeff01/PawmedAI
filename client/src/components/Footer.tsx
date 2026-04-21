import { Link } from '@tanstack/react-router'
import { PawIcon } from './custom/custom-icons'
import { Facebook, Github, Instagram, Linkedin } from 'react-bootstrap-icons'
import '../styles.css'

const navLinks = [
  { to: '/', label: 'Home' },
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
        <footer className="border-t border-slate-100 bg-white/60 px-5 py-6">
            <div className="flex justify-between items-start gap-8">
                {/* Branding & Contact Info */}
                <section>
                    <Link to="/" className="flex items-center gap-3">
                        <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-linear-to-br from-blue-500 to-blue-700 text-white shadow-sm">
                            <div className="rotate-20">
                                <PawIcon />
                            </div>
                        </div>
                        <div className="leading-tight">
                            <p className="text-[14px] font-bold tracking-tight text-slate-900">
                                Pawmed AI
                            </p>
                            <p className="text-[10.5px] font-medium tracking-wide text-slate-400">
                                Veterinary diagnostics
                            </p>
                        </div>
                    </Link>

                    <div className="text-xs text-slate-400">
                        <p>{contactInfo.email}</p>
                        <p>{contactInfo.phone}</p>
                        <p>{contactInfo.address}</p>
                    </div>
                </section>

                {/* Navigation Links */}
                <section>
                    <nav>
                        <ul className="flex flex-row gap-4">
                            {navLinks.map((link) => (
                                <li key={link.to}>
                                    <Link to={link.to} className="text-xs text-slate-400">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </section>

                {/* Social Media Links */}
                <section>
                    <ul className="flex flex-row gap-4">
                        {socialMediaLinks.map((social) => {
                            const IconComponent = social.icon
                            const isInstagram = social.platform === 'Instagram'
                            return (
                                <li key={social.platform}>
                                    <a href={social.url} aria-label={social.platform} className="text-slate-400 hover:text-slate-900 transition-colors" target="_blank" rel="noopener noreferrer">
                                        <IconComponent 
                                            size={20} 
                                            fill="currentColor"
                                            stroke={isInstagram ? 'none' : undefined}
                                            strokeWidth={isInstagram ? 0 : undefined}
                                        />
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            </div>
        </footer>
    )
}