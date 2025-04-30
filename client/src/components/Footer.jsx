"use client"

import { Globe, Linkedin, Github, Facebook } from "lucide-react"

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-teal-700 to-green-900 text-white py-8 rounded-xl">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Social Media Links */}
          <div className="flex flex-wrap gap-6">
            <a
              href="https://shoisob2004037.github.io/portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-yellow-300 transition-colors duration-30  text-zinc-300 no-underline"
            >
              <Globe className="w-5 h-5" />
              <span>Portfolio</span>
            </a>
            <a
              href="https://www.linkedin.com/in/mahadi-hasan-shaisob-bb72892b9/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-yellow-300 transition-colors duration-300 text-zinc-300 no-underline"
            >
              <Linkedin className="w-5 h-5" />
              <span>LinkedIn</span>
            </a>
            <a
              href="https://github.com/shoisob2004037/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-yellow-300 transition-colors duration-300  text-zinc-300 no-underline"
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
            <a
              href="https://www.facebook.com/hasan.shoisob"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-yellow-300 transition-colors duration-300  text-zinc-300 no-underline"
            >
              <Facebook className="w-5 h-5" />
              <span>Facebook</span>
            </a>
          </div>

          {/* Copyright and Description */}
          <div className="text-center md:text-right">
            <p className="text-sm font-semibold">
              © 2025 Shaisob, RUET Social
            </p>
            <p className="text-sm mt-1 opacity-80">
              Where alumni and students are connected
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer