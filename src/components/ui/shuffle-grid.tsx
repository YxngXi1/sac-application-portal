
"use client"

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const ShuffleHero = () => {
  return (
    <section className="w-full px-4 sm:px-8 py-8 sm:py-12 grid grid-cols-1 md:grid-cols-2 items-center gap-6 sm:gap-8 max-w-6xl mx-auto">
      <div className="order-2 md:order-1">
        <span className="block mb-3 sm:mb-4 text-xs md:text-sm text-blue-600 font-medium">
          Student Advisory Council
        </span>
        <h3 className="text-3xl sm:text-4xl md:text-6xl font-semibold text-gray-900 leading-tight">
          Make a Difference at John Fraser
        </h3>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 my-3 sm:my-4 md:my-6">
          Join our Student Advisory Council and help shape the future of our school community. Lead initiatives, organize events, and be the voice of student body.
        </p>
        <button className={cn(
          "bg-blue-600 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-md text-sm sm:text-base",
          "transition-all hover:bg-blue-700 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        )}>
          Apply Now
        </button>
      </div>
      <div className="order-1 md:order-2">
        <ShuffleGrid />
      </div>
    </section>
  );
};

const shuffle = (array: (typeof squareData)[0][]) => {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

const squareData = [
  {
    id: 1,
    src: "/lovable-uploads/e24ebc93-2ba8-4bff-9c7e-bd77971d1c8a.png",
  },
  {
    id: 2,
    src: "/lovable-uploads/2467c3e9-8f12-466c-9728-2c37d70d4253.png",
  },
  {
    id: 3,
    src: "/lovable-uploads/2b9a99f3-b52e-43b9-a487-956d9f2bd134.png",
  },
  {
    id: 4,
    src: "/lovable-uploads/0fa1e751-6935-47ee-943a-9d8706367c5a.png",
  },
  {
    id: 5,
    src: "/lovable-uploads/1514ca8b-9d26-4918-9d0f-afc0dfbb3534.png",
  },
  {
    id: 6,
    src: "/lovable-uploads/5d1fde08-1e19-4afe-8ad4-1103922485f0.png",
  },
  {
    id: 7,
    src: "/lovable-uploads/eabd5672-0ce1-435f-ba2c-547b780b0b32.png",
  },
  {
    id: 8,
    src: "/lovable-uploads/5dc8f24d-4afc-45c2-b6d0-aa7d186c204c.png",
  },
  {
    id: 9,
    src: "/lovable-uploads/1c2f4e51-a716-4315-9c5c-6fadb235fbc3.png",
  },
  {
    id: 10,
    src: "/lovable-uploads/3ff88213-39f9-4f0d-949c-0af99bdcde29.png",
  },
  {
    id: 11,
    src: "/lovable-uploads/fc7f7ad1-e42e-4faf-9c03-0161b31c5135.png",
  },
  {
    id: 12,
    src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
  },
  {
    id: 13,
    src: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
  },
  {
    id: 14,
    src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
  },
  {
    id: 15,
    src: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: 16,
    src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=684&q=80",
  },
];

const generateSquares = () => {
  return shuffle(squareData).map((sq) => (
    <motion.div
      key={sq.id}
      layout
      transition={{ duration: 1.5, type: "spring" }}
      className="w-full h-full rounded-md overflow-hidden bg-gray-100"
      style={{
        backgroundImage: `url(${sq.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    ></motion.div>
  ));
};

const ShuffleGrid = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [squares, setSquares] = useState(generateSquares());

  useEffect(() => {
    shuffleSquares();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const shuffleSquares = () => {
    setSquares(generateSquares());

    timeoutRef.current = setTimeout(shuffleSquares, 3000);
  };

  return (
    <div className="grid grid-cols-4 grid-rows-4 h-[300px] sm:h-[400px] md:h-[450px] gap-1">
      {squares.map((sq) => sq)}
    </div>
  );
};
