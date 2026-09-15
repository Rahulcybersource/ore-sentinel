import type { Variants } from "framer-motion";

export const colors = {
  navy: {
    900: '#0B1220',
    800: '#111C30',
    700: '#172640',
  },
  teal: {
    400: '#26F0D8',
    500: '#00D9C0',
    600: '#00B29E',
  },
  amber: {
    400: '#FFC04D',
    500: '#FFB020',
    600: '#E59819',
  },
  danger: {
    500: '#FF4500',
    600: '#E03D00',
  }
};

export const motionPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  } as Variants,
  
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.4, ease: "easeOut" }
  } as Variants,
  
  pulseAlert: {
    initial: { scale: 1, opacity: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
    },
    transition: { 
      duration: 1.5, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }
  } as Variants,
};
