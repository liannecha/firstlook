import type { Metadata } from "next";
import CarouselA from "./carousel-a";

export const metadata: Metadata = {
  title: "Version A | FirstLook",
};

export default function VersionA() {
  return <CarouselA />;
}
