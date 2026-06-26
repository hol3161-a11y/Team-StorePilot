"use client";

import { useEffect, useRef, useState } from "react";
import styles from '../app/landing.module.scss'

export default function FadeGroup({ children }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    //return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.fadeGroup} ${show ? styles.show : ""}`}
    >
      {children}
    </div>
  );
}