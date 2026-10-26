"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

/** Poziomy przewijany rząd kart (Embla), strzałki na desktopie, przesuwanie palcem na telefonie. */
export function CardCarousel({ children }: { children: React.ReactNode[] }) {
  return (
    <Carousel opts={{ align: "start", dragFree: true }} className="relative">
      <CarouselContent className="-ml-4">
        {children.map((child, i) => (
          <CarouselItem key={i} className="basis-[70%] pl-4 sm:basis-1/3 lg:basis-1/4">
            {child}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-4 hidden size-10 bg-card lg:flex" />
      <CarouselNext className="-right-4 hidden size-10 bg-card lg:flex" />
    </Carousel>
  );
}
