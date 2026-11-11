// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import { useMemo, useCallback } from "react"

/**
 * Social Icon Buttons — A glassmorphic grid of social media icon buttons with stunning hover effects
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 240
 * @framerIntrinsicHeight 240
 */

// ─── Built-in Icon SVGs ───

const builtInIcons: Record<string, string> = {
    twitter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>`,
    github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></svg>`,
    instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>`,
    linkedin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"/></svg>`,
    dribbble: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 8C119.252 8 8 119.252 8 256s111.252 248 248 248 248-111.252 248-248S392.748 8 256 8zm163.97 114.366c29.503 36.046 47.369 81.957 47.835 131.955-6.984-1.477-77.018-15.682-147.502-6.818-5.752-14.041-11.181-26.393-18.617-41.614 78.321-31.977 113.818-77.482 118.284-83.523zM396.421 97.87c-3.81 5.427-35.697 48.286-111.021 76.519-34.712-63.776-73.185-116.168-79.04-124.008 67.176-16.193 137.966 1.27 190.061 47.489zm-230.48-33.25c5.585 7.659 43.438 60.116 78.537 122.509-99.087 26.313-186.36 25.934-195.834 25.809C62.38 147.205 106.678 92.573 165.941 64.62zM44.17 256.323c0-2.166.043-4.322.108-6.473 9.268.19 111.92 1.513 217.706-30.146 6.064 11.868 11.857 23.915 17.174 35.949-76.599 21.575-146.194 83.527-180.531 142.306C64.794 360.405 44.17 310.73 44.17 256.323zm81.807 167.113c22.127-45.233 82.178-103.622 167.579-132.756 29.74 77.283 42.039 142.053 45.189 160.638-68.112 29.013-150.015 21.053-212.768-27.882zm248.38 8.489c-2.171-12.886-13.446-74.897-41.152-151.033 66.38-10.626 124.7 6.768 131.947 9.055-9.442 58.941-43.273 109.844-90.795 141.978z"/></svg>`,
    figma: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M14 95.79C14 42.89 56.89 0 109.79 0H274.16C327.07 0 369.95 42.89 369.95 95.79C369.95 129.29 352.76 158.78 326.71 176.46C352.76 194.15 369.95 223.63 369.95 257.13C369.95 310.04 327.07 352.93 274.16 352.93H269.16C248.53 352.93 229.64 344.8 215.95 331.48V415.42C215.95 468.33 173.07 511.21 120.16 511.21C67.26 511.21 24.37 468.33 24.37 415.42C24.37 381.92 41.56 352.44 67.61 334.75C41.56 317.07 24.37 287.58 24.37 254.08C24.37 220.58 41.56 191.1 67.61 173.41C41.56 155.73 24.37 126.24 24.37 92.74L14 95.79Z"/></svg>`,
    spotify: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 30.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z"/></svg>`,
    discord: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M524.531 69.836a1.5 1.5 0 0 0-.764-.7A485.065 485.065 0 0 0 404.081 32.03a1.816 1.816 0 0 0-1.923.91 337.461 337.461 0 0 0-14.9 30.6 447.848 447.848 0 0 0-134.426 0 309.541 309.541 0 0 0-15.135-30.6 1.89 1.89 0 0 0-1.924-.91 483.689 483.689 0 0 0-119.688 37.107 1.712 1.712 0 0 0-.788.676C39.068 183.651 18.186 294.69 28.43 404.354a2.016 2.016 0 0 0 .765 1.375 487.666 487.666 0 0 0 146.825 74.189 1.9 1.9 0 0 0 2.063-.676A348.2 348.2 0 0 0 208.12 430.4a1.86 1.86 0 0 0-1.019-2.588 321.173 321.173 0 0 1-45.868-21.853 1.885 1.885 0 0 1-.185-3.126 251.047 251.047 0 0 0 9.109-7.137 1.819 1.819 0 0 1 1.9-.256c96.229 43.917 200.41 43.917 295.5 0a1.812 1.812 0 0 1 1.924.233 234.533 234.533 0 0 0 9.132 7.16 1.884 1.884 0 0 1-.162 3.126 301.407 301.407 0 0 1-45.89 21.83 1.875 1.875 0 0 0-1 2.611 391.055 391.055 0 0 0 30.014 48.815 1.864 1.864 0 0 0 2.063.7A486.048 486.048 0 0 0 610.7 405.729a1.882 1.882 0 0 0 .765-1.352c12.264-126.783-20.532-236.912-86.934-334.541zM222.491 337.58c-28.972 0-52.844-26.587-52.844-59.239s23.409-59.241 52.844-59.241c29.665 0 53.306 26.82 52.843 59.239 0 32.654-23.41 59.241-52.843 59.241zm195.38 0c-28.971 0-52.843-26.587-52.843-59.239s23.409-59.241 52.843-59.241c29.667 0 53.307 26.82 52.844 59.239 0 32.654-23.177 59.241-52.844 59.241z"/></svg>`,
    youtube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg>`,
    tiktok: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14z"/></svg>`,
    facebook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256c0 120 82.7 220.8 194.2 248.5V334.2h-56.6v-78.2h56.6v-61.3c0-56 33.4-86.9 84.4-86.9 24.4 0 50 4.4 50 4.4v55h-28.2c-27.8 0-36.4 17.2-36.4 34.9v42h62l-9.9 78.2h-52.1v170.3C429.3 476.8 512 376 512 256z"/></svg>`,
    twitch: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M391.17 103.47H352.54v109.7h38.63zM285 103H246.37v109.7H285zM120.83 0 24.31 91.42v329.16h115.83V512l96.53-91.42h77.25L487.69 256V0zm328.24 237.75-77.22 73.12h-77.24l-67.6 64v-64h-86.87V36.58h308.93z"/></svg>`,
    pinterest: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path d="M496 256c0 137-111 248-248 248-25.6 0-50.2-3.9-73.4-11.1 10.1-16.5 25.2-43.5 30.8-65 3-11.6 15.4-59 15.4-59 8.1 15.4 31.7 28.5 56.8 28.5 74.8 0 128.7-68.8 128.7-154.3 0-81.9-66.9-143.2-152.9-143.2-107.2 0-165.9 76.2-165.9 148.1 0 36.4 19.4 81.7 50.3 96.1 4.7 2.2 7.2 1.2 8.3-3.3.8-3.4 5-20.3 6.9-28.1.6-2.5.3-4.7-1.7-7.1-10.1-12.5-18.3-35.3-18.3-56.6 0-54.7 41.4-107.6 112-107.6 60.9 0 103.6 41.5 103.6 100.9 0 67.1-33.9 113.6-78 113.6-24.3 0-42.6-20.1-36.7-44.8 7-29.5 20.5-61.3 20.5-82.6 0-19-10.2-34.9-31.4-34.9-24.9 0-44.9 25.7-44.9 60.2 0 22 7.4 36.8 7.4 36.8s-24.5 103.8-29 123.2c-5 21.4-3 51.6-.9 71.2C65.4 450.9 0 361.1 0 256 0 119 111 8 248 8s248 111 248 248z"/></svg>`,
    snapchat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M496.926 366.6c-3.373-9.176-9.8-14.086-17.112-18.153-1.376-.806-2.641-1.451-3.72-1.947-2.182-1.128-4.414-2.22-6.634-3.373-22.8-12.09-40.609-27.341-52.959-45.42a102.889 102.889 0 0 1-9.089-16.12c-1.054-3.013-1-4.724-.248-6.287a10.221 10.221 0 0 1 2.914-3.038c3.918-2.591 7.96-5.22 10.7-6.993 4.885-3.174 8.863-5.791 11.358-8.032a44.845 44.845 0 0 0 12.2-16.73 28.5 28.5 0 0 0 .454-17.836c-5.222-15.27-17.813-23.263-30.813-23.263a43.5 43.5 0 0 0-10.746 1.317c-.079.025-.164.054-.251.084.025-.435.054-.87.088-1.313a507.094 507.094 0 0 0 2.6-45.146c0-50.291-13.693-89.462-40.711-116.42C333.5 6.848 295.5.018 266.247.018h-20.532c-29.252 0-67.248 6.83-96.627 38.079C122.068 65.076 108.375 104.247 108.375 154.537a507.094 507.094 0 0 0 2.6 45.146c.034.444.063.882.088 1.313-.087-.03-.172-.059-.251-.084a43.5 43.5 0 0 0-10.746-1.317c-13 0-25.592 7.993-30.813 23.263a28.5 28.5 0 0 0 .454 17.836 44.845 44.845 0 0 0 12.2 16.73c2.5 2.241 6.473 4.858 11.358 8.032 2.736 1.773 6.778 4.4 10.7 6.993a10.221 10.221 0 0 1 2.914 3.038c.752 1.563.806 3.274-.248 6.287a102.889 102.889 0 0 1-9.089 16.12c-12.35 18.079-30.159 33.33-52.959 45.42-2.22 1.153-4.452 2.245-6.634 3.373-1.079.5-2.344 1.141-3.72 1.947-7.308 4.067-13.739 8.977-17.112 18.153-3.9 10.586-1.164 22.1 8.493 32.8 15.048 16.645 36.766 26.647 55.866 32.263 2.3.676 4.5 1.263 6.593 1.774a13.036 13.036 0 0 1 1.938.67c2.514 1.4 3.135 5.236 5.052 9.452a35.6 35.6 0 0 0 8.467 12.477c6.312 5.741 14.4 8.676 24.022 8.724 6.671 0 13.706-1.49 21.647-4.58a81.07 81.07 0 0 1 9.378-3.105c4.666-1.22 9.491-1.837 14.342-1.837 6.427 0 12.7.952 18.616 2.834 15.241 4.85 27.3 13.044 40.86 22.243 16.2 11 34.562 23.459 61.3 28.825a91.637 91.637 0 0 0 18.108 1.837 85.04 85.04 0 0 0 17.845-1.863c26.736-5.366 45.1-17.826 61.3-28.825 13.187-8.963 25.564-17.388 40.786-22.243a65.2 65.2 0 0 1 18.69-2.834c4.851 0 9.676.617 14.342 1.837a80.16 80.16 0 0 1 9.453 3.105c7.866 3.065 14.9 4.58 21.572 4.58h.075c9.617-.049 17.71-2.983 24.022-8.724a35.6 35.6 0 0 0 8.467-12.477c1.917-4.216 2.538-8.052 5.052-9.452a13.036 13.036 0 0 1 1.938-.67c2.088-.511 4.293-1.1 6.593-1.774 19.1-5.616 40.818-15.618 55.866-32.263 9.581-10.627 12.318-22.141 8.418-32.727z"/></svg>`,
    email: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"/></svg>`,
    website: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6C399.8 29.1 463.4 85.5 493.4 160zM256 416c-35.5 0-68.2-59.5-82.7-160H338.7C324.2 356.5 291.5 416 256 416zm-82.7-256C187.8 59.5 220.5 0 256 0s68.2 59.5 82.7 160H173.3zM135.3 160H18.6C48.6 85.5 112.2 29.1 190.6 8.4 165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-15.6-21.8-34.8-30.2-57.5H8.1c30 74.5 93.6 130.9 172 151.1-9-12.1-17.2-26.3-24.4-42.5-.5-1.1-1-2.2-1.5-3.3l40.5 0zM317.3 446.6c.5 1.1 1 2.2 1.5 3.3-7.2 16.2-15.4 30.4-24.4 42.5 78.4-20.2 142-76.6 172-151.1H310.5c-8.4 22.7-18.6 41.9-30.2 57.5l37 47.8z"/></svg>`,
}

const iconKeys = Object.keys(builtInIcons)

// ─── SVG Renderer (uses <img> with data URI for safety) ───

function SvgIcon({
    svgString,
    color,
    size,
}: {
    svgString: string
    color: string
    size: number
}) {
    const dataUrl = useMemo(() => {
        const colored = svgString
            .replace(/fill="[^"]*"/g, "")
            .replace(/<svg/, `<svg fill="${color}"`)
        return `data:image/svg+xml,${encodeURIComponent(colored)}`
    }, [svgString, color])

    return (
        <img
            src={dataUrl}
            width={size}
            height={size}
            alt=""
            style={{ display: "block" }}
        />
    )
}

// ─── Icon Button ───

interface IconButtonProps {
    svgString: string
    accentColor: string
    buttonSize: number
    iconSize: number
    borderRadius: number
    rotation: number
    bgColor: string
    borderOpacity: number
    shadowOpacity: number
    hoverColor: string
    hoverIntensity: number
    onClick?: () => void
}

function IconButton({
    svgString,
    accentColor,
    buttonSize,
    iconSize,
    borderRadius,
    rotation,
    bgColor,
    borderOpacity,
    shadowOpacity,
    hoverColor,
    hoverIntensity,
    onClick,
}: IconButtonProps) {
    const colorWithAlpha = useCallback(
        (alpha: number) => {
            if (accentColor.startsWith("#")) {
                const r = parseInt(accentColor.slice(1, 3), 16)
                const g = parseInt(accentColor.slice(3, 5), 16)
                const b = parseInt(accentColor.slice(5, 7), 16)
                return `rgba(${r}, ${g}, ${b}, ${alpha})`
            }
            if (accentColor.startsWith("rgb")) {
                const match = accentColor.match(/[\d.]+/g)
                if (match) {
                    return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`
                }
            }
            return accentColor
        },
        [accentColor]
    )

    const bgWithAlpha = useCallback(
        (alpha: number) => {
            if (bgColor.startsWith("#")) {
                const r = parseInt(bgColor.slice(1, 3), 16)
                const g = parseInt(bgColor.slice(3, 5), 16)
                const b = parseInt(bgColor.slice(5, 7), 16)
                return `rgba(${r}, ${g}, ${b}, ${alpha})`
            }
            if (bgColor.startsWith("rgb")) {
                const match = bgColor.match(/[\d.]+/g)
                if (match) {
                    return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`
                }
            }
            return bgColor
        },
        [bgColor]
    )

    const hoverWithAlpha = useCallback(
        (alpha: number) => {
            if (hoverColor.startsWith("#")) {
                const r = parseInt(hoverColor.slice(1, 3), 16)
                const g = parseInt(hoverColor.slice(3, 5), 16)
                const b = parseInt(hoverColor.slice(5, 7), 16)
                return `rgba(${r}, ${g}, ${b}, ${alpha})`
            }
            if (hoverColor.startsWith("rgb")) {
                const match = hoverColor.match(/[\d.]+/g)
                if (match) {
                    return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`
                }
            }
            return hoverColor
        },
        [hoverColor]
    )

    const buttonStyle: React.CSSProperties = useMemo(
        () => ({
            width: buttonSize,
            height: buttonSize,
            borderRadius: borderRadius,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
            border: `1px solid ${colorWithAlpha(borderOpacity)}`,
            background: `linear-gradient(135deg, ${bgWithAlpha(0.6)} 0%, ${bgWithAlpha(0.4)} 100%)`,
            backdropFilter: "blur(12px)",
            boxShadow:
                shadowOpacity > 0
                    ? `0 8px 32px 0 rgba(0, 0, 0, ${shadowOpacity})`
                    : "none",
        }),
        [
            buttonSize,
            borderRadius,
            colorWithAlpha,
            bgWithAlpha,
            borderOpacity,
            shadowOpacity,
        ]
    )

    const shimmerStyle: React.CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, transparent 0%, ${hoverWithAlpha(hoverIntensity)} 50%, transparent 100%)`,
            transform: "translateX(-100%)",
        }),
        [hoverWithAlpha, hoverIntensity]
    )

    return (
        <motion.button
            style={buttonStyle}
            onClick={onClick}
            initial={false}
            whileHover={{
                scale: 1.1,
                rotate: rotation,
                borderColor: colorWithAlpha(0.5),
                boxShadow:
                    shadowOpacity > 0
                        ? `0 16px 48px 0 ${colorWithAlpha(0.3)}`
                        : "none",
                background: `linear-gradient(135deg, ${hoverWithAlpha(hoverIntensity * 0.8)} 0%, ${bgWithAlpha(0.4)} 100%)`,
            }}
            whileTap={{
                scale: 0.95,
                rotate: 0,
            }}
            transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
            }}
        >
            <motion.div
                style={shimmerStyle}
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
            />
            <div style={{ position: "relative", zIndex: 10 }}>
                <SvgIcon
                    svgString={svgString}
                    color={accentColor}
                    size={iconSize}
                />
            </div>
        </motion.button>
    )
}

// ─── Main Component ───

interface ButtonConfig {
    icon: string
    customSvg: string
    color: string
    link: string
}

interface Props {
    buttons: ButtonConfig[]
    buttonSize: number
    iconSize: number
    borderRadius: number
    gap: number
    columns: number
    hoverRotation: number
    bgColor: string
    borderOpacity: number
    shadowOpacity: number
    hoverColor: string
    hoverIntensity: number
    style: React.CSSProperties
}

export default function SocialIconButtons(props: Props) {
    const {
        buttons = [
            {
                icon: "twitter",
                customSvg: "",
                color: "#ffffff",
                link: "https://x.com",
            },
            {
                icon: "facebook",
                customSvg: "",
                color: "#ffffff",
                link: "https://facebook.com",
            },
            {
                icon: "instagram",
                customSvg: "",
                color: "#ffffff",
                link: "https://instagram.com",
            },
            {
                icon: "dribbble",
                customSvg: "",
                color: "#ffffff",
                link: "https://dribbble.com",
            },
        ],
        buttonSize = 68,
        iconSize = 28,
        borderRadius = 50,
        gap = 24,
        columns = 4,
        hoverRotation = 3,
        bgColor = "#000000",
        borderOpacity = 0.2,
        shadowOpacity = 0.37,
        hoverColor = "#ffffff",
        hoverIntensity = 0.15,
        style,
    } = props

    const handleClick = useCallback((url: string) => {
        if (url) {
            window.open(url, "_blank", "noopener,noreferrer")
        }
    }, [])

    const containerStyle: React.CSSProperties = useMemo(
        () => ({
            ...style,
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, auto)`,
            gap: gap,
            width: "fit-content",
            height: "fit-content",
        }),
        [style, gap, columns]
    )

    if (!buttons || buttons.length === 0) {
        return (
            <div
                style={{
                    ...style,
                    padding: 20,
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 14,
                }}
            >
                Add at least one icon button
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            {buttons.map((btn, index) => {
                const svgString =
                    btn.customSvg && btn.customSvg.trim().startsWith("<svg")
                        ? btn.customSvg
                        : builtInIcons[btn.icon] || builtInIcons.twitter

                return (
                    <IconButton
                        key={index}
                        svgString={svgString}
                        accentColor={btn.color}
                        buttonSize={buttonSize}
                        iconSize={iconSize}
                        borderRadius={borderRadius}
                        rotation={
                            index % 2 === 0 ? hoverRotation : -hoverRotation
                        }
                        bgColor={bgColor}
                        borderOpacity={borderOpacity}
                        shadowOpacity={shadowOpacity}
                        hoverColor={hoverColor}
                        hoverIntensity={hoverIntensity}
                        onClick={() => handleClick(btn.link)}
                    />
                )
            })}
        </div>
    )
}

SocialIconButtons.defaultProps = {
    buttons: [
        {
            icon: "twitter",
            customSvg: "",
            color: "#ffffff",
            link: "https://x.com",
        },
        {
            icon: "facebook",
            customSvg: "",
            color: "#ffffff",
            link: "https://facebook.com",
        },
        {
            icon: "instagram",
            customSvg: "",
            color: "#ffffff",
            link: "https://instagram.com",
        },
        {
            icon: "dribbble",
            customSvg: "",
            color: "#ffffff",
            link: "https://dribbble.com",
        },
    ],
    buttonSize: 68,
    iconSize: 28,
    borderRadius: 50,
    gap: 24,
    columns: 4,
    hoverRotation: 3,
    bgColor: "#000000",
    borderOpacity: 0.2,
    shadowOpacity: 0.37,
    hoverColor: "#ffffff",
    hoverIntensity: 0.15,
}

addPropertyControls(SocialIconButtons, {
    buttons: {
        title: "Buttons",
        type: ControlType.Array,
        defaultValue: [
            {
                icon: "twitter",
                customSvg: "",
                color: "#ffffff",
                link: "https://x.com",
            },
            {
                icon: "facebook",
                customSvg: "",
                color: "#ffffff",
                link: "https://facebook.com",
            },
            {
                icon: "instagram",
                customSvg: "",
                color: "#ffffff",
                link: "https://instagram.com",
            },
            {
                icon: "dribbble",
                customSvg: "",
                color: "#ffffff",
                link: "https://dribbble.com",
            },
        ],
        maxCount: 20,
        control: {
            type: ControlType.Object,
            controls: {
                icon: {
                    title: "Icon",
                    type: ControlType.Enum,
                    options: iconKeys,
                    optionTitles: iconKeys.map(
                        (k) => k.charAt(0).toUpperCase() + k.slice(1)
                    ),
                    defaultValue: "twitter",
                },
                customSvg: {
                    title: "Custom SVG",
                    type: ControlType.String,
                    defaultValue: "",
                    placeholder: "Paste <svg>...</svg> to override",
                    displayTextArea: true,
                    description:
                        "Paste a full SVG string to use a custom icon instead of the preset above.",
                },
                color: {
                    title: "Color",
                    type: ControlType.Color,
                    defaultValue: "#ffffff",
                },
                link: {
                    title: "Link",
                    type: ControlType.String,
                    defaultValue: "",
                    placeholder: "https://...",
                },
            },
        },
    },

    // Layout
    columns: {
        title: "Columns",
        type: ControlType.Number,
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    buttonSize: {
        title: "Button Size",
        type: ControlType.Number,
        defaultValue: 68,
        min: 32,
        max: 120,
        step: 1,
    },
    iconSize: {
        title: "Icon Size",
        type: ControlType.Number,
        defaultValue: 28,
        min: 12,
        max: 64,
        step: 1,
    },
    borderRadius: {
        title: "Border Radius",
        type: ControlType.Number,
        defaultValue: 50,
        min: 0,
        max: 60,
        step: 1,
    },
    gap: {
        title: "Gap",
        type: ControlType.Number,
        defaultValue: 24,
        min: 0,
        max: 64,
        step: 1,
    },

    // Style
    bgColor: {
        title: "BG Color",
        type: ControlType.Color,
        defaultValue: "#000000",
        description: "Button background tint color",
    },
    borderOpacity: {
        title: "Border Opacity",
        type: ControlType.Number,
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Border uses the icon accent color at this opacity",
    },
    shadowOpacity: {
        title: "Shadow",
        type: ControlType.Number,
        defaultValue: 0.37,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Set to 0 to remove the shadow entirely",
    },
    hoverColor: {
        title: "Hover Color",
        type: ControlType.Color,
        defaultValue: "#ffffff",
        description:
            "Color of the shimmer sweep and background overlay on hover",
    },
    hoverIntensity: {
        title: "Hover Intensity",
        type: ControlType.Number,
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Opacity of the hover overlay (0 = invisible, 1 = full)",
    },

    // Animation
    hoverRotation: {
        title: "Hover Rotation",
        type: ControlType.Number,
        defaultValue: 3,
        min: 0,
        max: 15,
        step: 1,
    },
})
