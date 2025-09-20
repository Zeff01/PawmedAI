"use client";

import { Upload, Lock } from "lucide-react";
import { useState } from "react";

export function HeroBanner() {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Handle file drop logic here
    // TODO: Implement file upload functionality with e.dataTransfer.files
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden z-0">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url(/banner/dog.png)",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-14 text-center text-white">
        {/* Main Heading */}
        <div className="mb-5">
          <h1 className="text-6xl font-black leading-none md:text-8xl lg:text-9xl xl:text-[6rem] tracking-tight">
            Real care
          </h1>
          <h1 className="text-6xl font-black leading-none md:text-8xl lg:text-9xl xl:text-[6rem] tracking-tight">
            starts here.
          </h1>
        </div>

        {/* Subtitle */}
        <div className="mb-10 max-w-2xl space-y-1 text-base md:text-2xl leading-tight">
          <p>A new standard in early pet wellness.</p>
          <p>Trusted by tech, grounded in care.</p>
        </div>

        {/* Upload Widget */}
        <div className="w-full max-w-lg rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6 shadow-2xl">
          {/* Inner Container - Small Box */}
          <div
            className={`relative w-full rounded-2xl bg-white/12 backdrop-blur-md border border-white/30 p-6 transition-all duration-300 ${
              isDragOver ? "bg-white/90 border-white/50" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              {/* Upload Icon */}
              <div className="rounded-full bg-orange-500 p-3">
                <Upload className="h-6 w-6 text-white" />
              </div>

              {/* Upload Text */}
              <div className="text-center">
                <p className="text-gray-300 text-lg font-medium">
                  Drop your images here or
                </p>
              </div>

              {/* Browse Files Button */}
              <button
                // onClick={handleBrowseFiles}
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 px-8 py-3 text-white font-semibold rounded-lg border-0 text-base transition-colors duration-200"
              >
                Browse Files
              </button>

              {/* Support Text */}
              <p className="text-sm text-gray-400 font-normal">
                Supported formats: JPG, PNG
              </p>
            </div>
          </div>

          {/* Privacy Notice - Outside inner box but inside outer box */}
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-white/80">
            <Lock className="h-4 w-4" />
            <p>Your data stays yours. Nothing is stored or shared.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
