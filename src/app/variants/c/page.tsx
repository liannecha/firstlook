import type { Metadata } from "next";
import CarouselB from "./carousel-c";

export const metadata: Metadata = {
  title: "Version C | FirstLook",
};

export default function VersionC() {
  return <CarouselB />;
}
