'use client';

import React from 'react';
import Image from 'next/image';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'badge' | 'plain';
  className?: string;
  onClick?: () => void;
}

export default function Logo({
  size = 'md',
  variant = 'default',
  className = '',
  onClick,
}: LogoProps) {
  // Kích thước chuẩn theo tỷ lệ ảnh gốc (586x237 ~ 2.47:1)
  const sizeMap = {
    xs: { height: 26, width: 64, imgClass: 'h-[26px] w-auto' },
    sm: { height: 32, width: 79, imgClass: 'h-[32px] w-auto' },
    md: { height: 40, width: 99, imgClass: 'h-[40px] w-auto' },
    lg: { height: 48, width: 119, imgClass: 'h-[48px] w-auto' },
    xl: { height: 60, width: 148, imgClass: 'h-[60px] w-auto' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const imageElement = (
    <img
      src="/images/stockai-logo.png"
      alt="StockAI — Artificial Smart Trading"
      width={currentSize.width}
      height={currentSize.height}
      className={`object-contain block ${currentSize.imgClass}`}
      loading="eager"
    />
  );

  if (variant === 'plain') {
    return (
      <div 
        onClick={onClick} 
        className={`inline-flex items-center shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        {imageElement}
      </div>
    );
  }

  // Variant 'default' hoặc 'badge': bọc trong thẻ nền dark navy công nghệ cao bo tròn
  // giúp hiển thị sắc nét, đồng bộ và sang trọng trên cả nền sáng (FireAnt #F4F7FF / #FFFFFF) và nền tối
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center bg-[#101B4B] border border-[#1E293B]/80 rounded-xl px-2.5 py-1 shadow-2xs shrink-0 select-none ${
        onClick ? 'cursor-pointer hover:border-[#087CFF]/60 transition' : ''
      } ${className}`}
      title="StockAI — Artificial Smart Trading"
    >
      {imageElement}
    </div>
  );
}
