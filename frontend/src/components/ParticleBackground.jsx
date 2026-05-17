import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/particles.css';

export default function ParticleBackground() {
  const [size, setSize] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    const update = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const particles = Array.from({ length: 50 }, (_, i) => (
    <motion.div
      key={i}
      className="particle"
      initial={{
        x: Math.random() * size.w,
        y: Math.random() * size.h,
        opacity: Math.random() * 0.5,
      }}
      animate={{
        x: Math.random() * size.w,
        y: Math.random() * size.h,
        opacity: Math.random() * 0.5,
      }}
      transition={{
        duration: Math.random() * 20 + 20,
        repeat: Infinity,
      }}
    />
  ));

  return <motion.div className="particles-container">{particles}</motion.div>;
}
