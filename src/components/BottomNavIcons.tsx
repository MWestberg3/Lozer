import type { SVGProps } from 'react'

function IconSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="bottom-nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  )
}

export function IconHome() {
  return (
    <IconSvg>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </IconSvg>
  )
}

export function IconLibrary() {
  return (
    <IconSvg>
      <path d="M12 6.5v12.5" />
      <path d="M3 18.5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1h4.75a3.25 3.25 0 0 1 3.25 3.25 3.25 3.25 0 0 1 3.25-3.25H19a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-5.5a2.75 2.75 0 0 0-2.75 2.75 2.75 2.75 0 0 0-2.75-2.75H5.5" />
    </IconSvg>
  )
}

export function IconWeight() {
  return (
    <IconSvg>
      <path d="M6.5 7.5h3v9h-3a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 6.5 7.5Z" />
      <path d="M14.5 7.5h3a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-3v-9Z" />
      <path d="M9.5 9h5M9.5 12h5M9.5 15h5" />
    </IconSvg>
  )
}

export function IconProgress() {
  return (
    <IconSvg>
      <path d="M4 18V6" />
      <path d="M4 18h16" />
      <path d="M8 15V11M12 15V8M16 15V5" />
    </IconSvg>
  )
}

export function IconSettings() {
  return (
    <IconSvg>
      <path d="M9.67 4.14a2.34 2.34 0 0 1 4.66 0 2.34 2.34 0 0 0 3.32 1.91 2.34 2.34 0 0 1 2.33 4.03 2.34 2.34 0 0 0 0 3.83 2.34 2.34 0 0 1-2.33 4.03 2.34 2.34 0 0 0-3.32 1.91 2.34 2.34 0 0 1-4.66 0 2.34 2.34 0 0 0-3.32-1.91 2.34 2.34 0 0 1-2.33-4.03 2.34 2.34 0 0 0 0-3.83 2.34 2.34 0 0 1 2.33-4.03 2.34 2.34 0 0 0 3.32-1.91Z" />
      <circle cx="12" cy="12" r="3" />
    </IconSvg>
  )
}
