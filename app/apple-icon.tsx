import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width="160"
        height="160"
        viewBox="0 0 1024 1024"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M418.667 792H481.222H543.778H606.333M231 385.75L512.5 167L794 385.75V729.5C794 746.076 787.409 761.973 775.678 773.694C763.946 785.415 748.035 792 731.444 792H293.556C276.965 792 261.054 785.415 249.322 773.694C237.591 761.973 231 746.076 231 729.5V385.75Z"
          stroke="#4DCA4F"
          strokeWidth="80"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M511.892 765.5V631.375M599.189 595.365C550.976 643.578 472.807 643.578 424.594 595.365C376.382 547.152 376.382 468.983 424.594 420.77C472.807 372.557 550.976 372.557 599.189 420.77C647.402 468.983 647.402 547.152 599.189 595.365Z"
          stroke="#4DCA4F"
          strokeWidth="80"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#clip0)"
        />
        <defs>
          <clipPath id="clip0">
            <rect
              width="370.371"
              height="370.371"
              fill="white"
              transform="translate(511.892 268) rotate(45)"
            />
          </clipPath>
        </defs>
      </svg>
    </div>,
    { ...size }
  )
}
