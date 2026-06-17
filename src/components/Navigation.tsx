'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CircleStackIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

const NAV_ITEMS = [
  { href: '/', label: 'Directory', icon: CircleStackIcon, id: 'nav-directory' },
  { href: '/diff', label: 'Response Diff', icon: ArrowsRightLeftIcon, id: 'nav-diff' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-xl"
      style={{ background: 'rgba(13, 15, 20, 0.85)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" id="nav-logo">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                boxShadow: '0 0 0 0 rgba(168,85,247,0.3)',
              }}
            >
              {/* Magnifying glass icon inline */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="5.5" cy="5.5" r="4" stroke="white" strokeWidth="1.5"/>
                <line x1="8.7" y1="8.7" x2="12" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Route<span className="text-gradient">Lens</span>
            </span>
          </Link>

          {/* Nav tabs */}
          <nav className="flex items-center">
            {NAV_ITEMS.map(({ href, label, icon: Icon, id }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  id={id}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-150 font-medium"
                  style={{
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    background: active ? 'var(--accent-dim)' : 'transparent',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side - Digital Heroes badge */}
          <a
            href="https://digitalheroesco.com"
            target="_blank"
            rel="noopener noreferrer"
            id="built-for-digital-heroes"
            className="btn-secondary text-xs py-1.5"
          >
            Built for Digital Heroes
          </a>
        </div>
      </div>

      {/* Signature glow rule */}
      <div className="glow-rule" />
    </header>
  );
}
