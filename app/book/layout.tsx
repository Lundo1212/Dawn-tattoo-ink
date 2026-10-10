import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description:
    "Choose a tattoo service and request an appointment with Dawn Tattoo Ink in Dallas, Texas.",
  alternates: {
    canonical: "/book",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function BookingLayout({ children }: LayoutProps<"/book">) {
  return children;
}