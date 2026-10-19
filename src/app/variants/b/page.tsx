import type { Metadata } from "next";
import CarouselB from "./carousel-b";

export const metadata: Metadata = {
  title: "Version B | FirstLook",
};

export default function VersionB() {
  return <CarouselB />;
}
