"use client";
import React from "react";
import { SignInButton, SignUpButton, UserButton, Show } from "@clerk/nextjs";
import { useStoreUser } from "./hooks/use-store-user";import { BarLoader } from "react-spinners"; // 1. Import the loader
import { usePathname } from "next/navigation";
import { Unauthenticated } from "convex/react";
import Link from "next/link"; // <-- ADD THIS LINE
import { Button } from "./button";
import Image from "next/image";
import { Authenticated } from "convex/react";
import { LayoutDashboard } from "lucide-react";
const Header = () => {
  const { isLoading } = useStoreUser();
  const path=usePathname();
  return (
    
      <header className="fixed top-0 w-full border-b bg-white/95 backdrop-blur z-50">
        <nav className="container mx-suto px-4 h-16 flex items-center justify-between">
        <Link href='/' className="flex items-cemter gap-2">
         <Image
         src={"/logos/logo.png"}
         alt="Splitr Logo"
         width={200}
         height={60}
         className="h-11 w-auto object-contain"
         />

         </Link>

        
        {path=='/' &&(
          <div className="hidden md:flex items-center gap-6">
            <Link 
            href="#features"
            className="text-sm font-medium hover:text-green-600 transition"
            >
              Features
              </Link>
              <Link 
            href="#how-it-works"
            className="text-sm font-medium hover:text-green-600 transition"
            >
              How it works
              </Link>
          </div>
        )}
        <div className="fflex items-center gap-4">
          <Authenticated>
            <Link href="/dashboard">
            <Button
              variant="outline"
              className="hidden md:inline-flex items-center gap-2 hover:text-green-600
              hover:border-green-600-transition"
              >
                <LayoutDashboard className="h-4 w-4"/>
                Dashboard
              </Button>
              </Link>
              <Button variant="ghost" className="md:hidden w-30 h-10 p-0">
                <LayoutDashboard className="h-4 w-4"/>
              </Button>
              <UserButton/>
          </Authenticated>
          <Unauthenticated>
            <SignInButton>
              <Button variant={"ghost"}>Sign In</Button>
            </SignInButton>

             <SignUpButton>
              <Button className="bg-green-600 hover:bg-green-700 border-none">
                Get Started
              </Button>
            </SignUpButton>
          </Unauthenticated>
        </div>
      
        </nav>

        {/* 2. Add the BarLoader right here under the nav bar */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 w-full">
            <BarLoader color="#ef4444" width="100%" height={3} />
          </div>
        )}
      </header>
   
  );
};

export default Header;